using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AirAware.Configuration;
using AirAware.Data;
using AirAware.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace AirAware.Controllers;

/// <summary>
/// Authentifizierungs-Controller für JWT-Token-Ausgabe.
/// POST /api/auth/register ? registriert einen neuen Benutzer.
/// POST /api/auth/login ? gibt bei gültigen Credentials ein Bearer-Token zurück.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController(AirAwareDbContext db, IOptions<JwtOptions> jwtOptions) : ControllerBase
{
    private readonly JwtOptions _jwt = jwtOptions.Value;

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
            ExpiresAt = expiresAt
        });
    }
}
