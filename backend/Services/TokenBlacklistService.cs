using System.Collections.Concurrent;

namespace AirAware.Services;

/// <summary>
/// In-Memory-Blacklist für widerrufene JWT-Token.
/// Speichert die JTI (JWT ID) zusammen mit dem Ablaufzeitpunkt,
/// damit abgelaufene Einträge automatisch bereinigt werden.
/// </summary>
public class TokenBlacklistService
{
    private readonly ConcurrentDictionary<string, DateTime> _revokedTokens = new();

    /// <summary>Widerruft ein Token anhand seiner JTI bis zum Ablaufzeitpunkt.</summary>
    public void Revoke(string jti, DateTime expiresUtc)
    {
        _revokedTokens.TryAdd(jti, expiresUtc);
        Cleanup();
    }

    /// <summary>Prüft ob ein Token widerrufen wurde.</summary>
    public bool IsRevoked(string jti) => _revokedTokens.ContainsKey(jti);

    /// <summary>Entfernt abgelaufene Einträge (Token wären sowieso ungültig).</summary>
    private void Cleanup()
    {
        var now = DateTime.UtcNow;
        foreach (var kvp in _revokedTokens)
        {
            if (kvp.Value < now)
                _revokedTokens.TryRemove(kvp.Key, out _);
        }
    }
}
