using System.Collections.Concurrent;
using AirAware.Attributes;

namespace AirAware.Middleware;

/// <summary>
/// Prüft bei Endpoints mit [RequireAdminPin] ob ein gültiger PIN im Header "X-Admin-Pin" mitgesendet wird.
/// Enthält Brute-Force-Schutz: Nach 5 Fehlversuchen wird die IP für 15 Minuten gesperrt.
/// In Development wird die Prüfung übersprungen, damit Swagger/Tests ohne PIN funktionieren.
/// </summary>
public class AdminPinAuthMiddleware(RequestDelegate next, IConfiguration config, IHostEnvironment env)
{
    private const string AdminPinHeaderName = "X-Admin-Pin";
    private const int MaxFailedAttempts = 3;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    /// <summary>
    /// Speichert fehlgeschlagene Versuche pro IP-Adresse für den Brute-Force-Schutz.
    /// </summary>
    private static readonly ConcurrentDictionary<string, FailedAttemptInfo> FailedAttempts = new();

    public async Task InvokeAsync(HttpContext context)
    {
        var endpoint = context.GetEndpoint();
        var requiresAdminPin = endpoint?.Metadata.GetMetadata<RequireAdminPinAttribute>() is not null;

        if (requiresAdminPin && !env.IsDevelopment())
        {
            var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            // Brute-Force-Schutz: IP prüfen
            if (IsLockedOut(clientIp))
            {
                context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                await context.Response.WriteAsJsonAsync(new
                {
                    Error = "Zu viele fehlgeschlagene Versuche. Bitte warte 15 Minuten."
                });
                return;
            }

            var configuredPin = config["AdminPin"];

            if (string.IsNullOrEmpty(configuredPin))
            {
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                await context.Response.WriteAsJsonAsync(new
                {
                    Error = "Admin-PIN ist serverseitig nicht konfiguriert."
                });
                return;
            }

            if (!context.Request.Headers.TryGetValue(AdminPinHeaderName, out var providedPin)
                || !string.Equals(providedPin, configuredPin, StringComparison.Ordinal))
            {
                RecordFailedAttempt(clientIp);

                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsJsonAsync(new
                {
                    Error = "Ungültiger oder fehlender Admin-PIN. Header 'X-Admin-Pin' erforderlich."
                });
                return;
            }

            // Erfolgreicher Login → Fehlversuche zurücksetzen
            FailedAttempts.TryRemove(clientIp, out _);
        }

        await next(context);
    }

    private static bool IsLockedOut(string clientIp)
    {
        if (!FailedAttempts.TryGetValue(clientIp, out var info))
            return false;

        // Lockout abgelaufen → Eintrag entfernen
        if (info.LockedUntil.HasValue && DateTime.UtcNow >= info.LockedUntil.Value)
        {
            FailedAttempts.TryRemove(clientIp, out _);
            return false;
        }

        return info.LockedUntil.HasValue;
    }

    private static void RecordFailedAttempt(string clientIp)
    {
        var info = FailedAttempts.GetOrAdd(clientIp, _ => new FailedAttemptInfo());

        info.Count++;

        if (info.Count >= MaxFailedAttempts)
        {
            info.LockedUntil = DateTime.UtcNow.Add(LockoutDuration);
        }
    }

    private class FailedAttemptInfo
    {
        public int Count { get; set; }
        public DateTime? LockedUntil { get; set; }
    }
}
