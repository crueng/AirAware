using AirAware.Attributes;

namespace AirAware.Middleware;

/// <summary>
/// Prüft bei Endpoints mit [RequireApiKey] ob ein gültiger API-Key im Header "X-Api-Key" mitgesendet wird.
/// In Development wird die Prüfung übersprungen, damit Swagger/Tests ohne Key funktionieren.
/// </summary>
public class ApiKeyAuthMiddleware(RequestDelegate next, IConfiguration config, IHostEnvironment env)
{
    private const string ApiKeyHeaderName = "X-Api-Key";

    public async Task InvokeAsync(HttpContext context)
    {
        var endpoint = context.GetEndpoint();
        var requiresApiKey = endpoint?.Metadata.GetMetadata<RequireApiKeyAttribute>() is not null;

        if (requiresApiKey && !env.IsDevelopment())
        {
            var configuredKey = config["ApiKey"];

            if (string.IsNullOrEmpty(configuredKey))
            {
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                await context.Response.WriteAsJsonAsync(new { Error = "API-Key ist serverseitig nicht konfiguriert." });
                return;
            }

            if (!context.Request.Headers.TryGetValue(ApiKeyHeaderName, out var providedKey)
                || !string.Equals(providedKey, configuredKey, StringComparison.Ordinal))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsJsonAsync(new { Error = "Ungültiger oder fehlender API-Key. Header 'X-Api-Key' erforderlich." });
                return;
            }
        }

        await next(context);
    }
}
