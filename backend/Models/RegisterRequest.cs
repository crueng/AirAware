using System.ComponentModel.DataAnnotations;

namespace AirAware.Models;

/// <summary>
/// DTO für den Registrierungs-Request.
/// </summary>
public class RegisterRequest
{
    [Required]
    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;
}
