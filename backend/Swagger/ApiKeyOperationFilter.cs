using AirAware.Attributes;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace AirAware.Swagger;

/// <summary>
/// Fügt in Swagger automatisch ein "X-Api-Key" Header-Feld für alle Endpoints
/// mit [RequireApiKey] hinzu.
/// </summary>
public class ApiKeyOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var hasApiKeyAttribute = context.MethodInfo
            .GetCustomAttributes(typeof(RequireApiKeyAttribute), true)
            .Length > 0
            || context.MethodInfo.DeclaringType?
                .GetCustomAttributes(typeof(RequireApiKeyAttribute), true)
                .Length > 0;

        if (!hasApiKeyAttribute)
            return;

        operation.Parameters ??= [];

        operation.Parameters.Add(new OpenApiParameter
        {
            Name = "X-Api-Key",
            In = ParameterLocation.Header,
            Required = true,
            Description = "API-Key für schreibende Endpoints",
            Schema = new OpenApiSchema { Type = JsonSchemaType.String }
        });
    }
}
