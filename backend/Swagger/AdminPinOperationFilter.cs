using AirAware.Attributes;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace AirAware.Swagger;

/// <summary>
/// Fügt in Swagger automatisch ein "X-Admin-Pin" Header-Feld für alle Endpoints
/// mit [RequireAdminPin] hinzu.
/// </summary>
public class AdminPinOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var hasAdminPinAttribute = context.MethodInfo
            .GetCustomAttributes(typeof(RequireAdminPinAttribute), true)
            .Length > 0
            || context.MethodInfo.DeclaringType?
                .GetCustomAttributes(typeof(RequireAdminPinAttribute), true)
                .Length > 0;

        if (!hasAdminPinAttribute)
            return;

        operation.Parameters ??= [];

        operation.Parameters.Add(new OpenApiParameter
        {
            Name = "X-Admin-Pin",
            In = ParameterLocation.Header,
            Required = true,
            Description = "Admin-PIN für geschützte Endpoints (Threshold-Verwaltung)",
            Schema = new OpenApiSchema { Type = JsonSchemaType.String }
        });
    }
}
