namespace AirAware.Models;

/// <summary>
/// DTO für die Login-Antwort mit JWT-Token.
/// </summary>
public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}
