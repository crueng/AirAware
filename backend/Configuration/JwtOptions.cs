namespace AirAware.Configuration;

/// <summary>
/// Konfigurationsoptionen für JWT-Bearer-Token-Authentifizierung.
/// Abschnitt: "Jwt" in appsettings.json.
/// </summary>
public class JwtOptions
{
    public const string SectionName = "Jwt";

    /// <summary>Geheimer Schlüssel zum Signieren der Tokens (min. 32 Zeichen).</summary>
    public string Secret { get; set; } = string.Empty;

    /// <summary>Issuer (Aussteller) des Tokens.</summary>
    public string Issuer { get; set; } = "AirAware";

    /// <summary>Audience (Empfänger) des Tokens.</summary>
    public string Audience { get; set; } = "AirAware";

    /// <summary>Gültigkeitsdauer des Tokens in Minuten.</summary>
    public int ExpirationMinutes { get; set; } = 60;
}
