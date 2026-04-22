using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AirAware.Configuration;
using AirAware.Data;
using AirAware.Models;
using AirAware.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace AirAware.Controllers;

/// <summary>
/// Authentifizierungs-Controller für JWT-Token-Ausgabe.
/// POST /api/auth/register ? registriert einen neuen Benutzer.
/// POST /api/auth/login    ? gibt bei gültigen Credentials ein Bearer-Token zurück.
/// POST /api/auth/logout   ? widerruft das aktuelle Token.
/// DELETE /api/auth/user/{username} ? löscht einen Benutzer.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController(AirAwareDbContext db, IOptions<JwtOptions> jwtOptions, TokenBlacklistService blacklist) : ControllerBase
{
    private readonly JwtOptions _jwt = jwtOptions.Value;
    private static readonly TimeZoneInfo BerlinTz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Berlin");

    /// <summary>
    /// Registriert einen neuen Benutzer.
    /// Passwort wird als BCrypt-Hash in der Datenbank gespeichert.
    /// Erfordert ein gültiges JWT-Token (nur eingeloggte Admins dürfen neue User anlegen).
    /// </summary>
    [Authorize]
    [HttpPost("register")]
    public async Task<ActionResult> Register([FromBody] RegisterRequest request)
    {
        var exists = await db.Users.AnyAsync(u => u.Username == request.Username);
        if (exists)
            return Conflict(new { Error = "Benutzername ist bereits vergeben." });

        var user = new User
        {
            Username = request.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "Admin"
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return Ok(new { Message = "Benutzer erfolgreich registriert.", user.Username });
    }

    /// <summary>
    /// Meldet einen Benutzer an und gibt ein JWT-Bearer-Token zurück.
    /// Die Credentials werden gegen die Datenbank geprüft (BCrypt).
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Username);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { Error = "Ungültiger Benutzername oder Passwort." });

        var expiresAt = DateTime.UtcNow.AddMinutes(_jwt.ExpirationMinutes);

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return Ok(new LoginResponse
        {
            Token = tokenString,
            ExpiresAt = TimeZoneInfo.ConvertTimeFromUtc(expiresAt, BerlinTz)
        });
    }

    /// <summary>
    /// Ändert das Passwort des aktuell eingeloggten Benutzers.
    /// Das aktuelle Passwort muss zur Bestätigung angegeben werden.
    /// </summary>
    [Authorize]
    [HttpPost("change-password")]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var username = User.FindFirst(ClaimTypes.Name)?.Value;
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);

        if (user is null)
            return NotFound(new { Error = "Benutzer nicht gefunden." });

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return BadRequest(new { Error = "Aktuelles Passwort ist falsch." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await db.SaveChangesAsync();

        return Ok(new { Message = "Passwort erfolgreich geändert." });
    }

    /// <summary>
    /// Meldet den aktuellen Benutzer ab, indem das JWT-Token widerrufen wird.
    /// Das Token wird bis zum Ablauf auf eine Blacklist gesetzt.
    /// </summary>
    [Authorize]
    [HttpPost("logout")]
    public ActionResult Logout()
    {
        var jti = User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
        var exp = User.FindFirst(JwtRegisteredClaimNames.Exp)?.Value;

        if (jti is null)
            return BadRequest(new { Error = "Token enthält keine JTI." });

        var expiresAt = exp is not null
            ? DateTimeOffset.FromUnixTimeSeconds(long.Parse(exp)).UtcDateTime
            : DateTime.UtcNow.AddMinutes(_jwt.ExpirationMinutes);

        blacklist.Revoke(jti, expiresAt);

        return Ok(new { Message = "Erfolgreich abgemeldet. Token wurde widerrufen." });
    }

    /// <summary>
    /// Löscht einen Benutzer anhand des Benutzernamens.
    /// Erfordert ein gültiges JWT-Token.
    /// </summary>
    [Authorize]
    [HttpDelete("user/{username}")]
    public async Task<ActionResult> DeleteUser(string username)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);

        if (user is null)
            return NotFound(new { Error = $"Benutzer '{username}' nicht gefunden." });

        db.Users.Remove(user);
        await db.SaveChangesAsync();

        return Ok(new { Message = $"Benutzer '{username}' wurde gelöscht." });
    }
}
