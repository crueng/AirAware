using AirAware.Data;
using AirAware.Middleware;
using AirAware.Swagger;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.OperationFilter<ApiKeyOperationFilter>();
});

builder.Services.AddDbContext<AirAwareDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("AirAwareDb")));

// CORS: In Development alles erlauben, in Production nur konfigurierte Origins
builder.Services.AddCors(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        options.AddDefaultPolicy(policy =>
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader());
    }
    else
    {
        var allowedOrigins = builder.Configuration
            .GetSection("AllowedOrigins")
            .Get<string[]>() ?? [];

        options.AddDefaultPolicy(policy =>
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader());
    }
});

var app = builder.Build();

// In Production: Forwarded Headers von Cloudflare verarbeiten,
// damit die App die echte Client-IP kennt
if (!app.Environment.IsDevelopment())
{
    app.UseForwardedHeaders(new ForwardedHeadersOptions
    {
        ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor
                         | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
    });

    // HTTPS-Redirect wird von Cloudflare am Edge gemacht ("Always Use HTTPS"),
    // daher hier NICHT UseHttpsRedirection() verwenden – sonst Redirect-Loop!
}

// Swagger auch in Production verfügbar (mit API-Key geschützte Endpoints testen)
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors();

// API-Key Middleware für schreibende Endpoints
app.UseMiddleware<ApiKeyAuthMiddleware>();

app.MapControllers();

app.Run();
