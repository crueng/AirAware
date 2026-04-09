using System.ComponentModel.DataAnnotations;

namespace AirAware.Models;

/// <summary>
/// DTO für den Login-Request.
/// </summary>
public class LoginRequest
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
