using System.Text;
using AirAware.Configuration;
using AirAware.Data;
using AirAware.Middleware;
using AirAware.Services;
using AirAware.Swagger;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.OperationFilter<ApiKeyOperationFilter>();
    options.OperationFilter<AdminPinOperationFilter>();

    // JWT Bearer Token in Swagger UI
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT-Token eingeben. Beispiel: eyJhbGci..."
    });
    options.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer", doc),
            []
        }
    });
});

builder.Services.AddDbContext<AirAwareDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("AirAwareDb")));

// MQTT: Konfiguration binden und Hintergrund-Service registrieren
builder.Services.Configure<MqttOptions>(builder.Configuration.GetSection(MqttOptions.SectionName));
builder.Services.AddHostedService<MqttSubscriberService>();

// JWT: Konfiguration binden und Authentication registrieren
var jwtSection = builder.Configuration.GetSection(JwtOptions.SectionName);
builder.Services.Configure<JwtOptions>(jwtSection);

var jwtOptions = jwtSection.Get<JwtOptions>()!;
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtOptions.Issuer,
        ValidAudience = jwtOptions.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Secret))
    };
});
builder.Services.AddAuthorization();

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

// JWT-Bearer-Authentifizierung
app.UseAuthentication();
app.UseAuthorization();

// API-Key Middleware für schreibende Endpoints (ESP32)
app.UseMiddleware<ApiKeyAuthMiddleware>();

// Admin-PIN Middleware für Frontend-Endpoints (Threshold-Verwaltung)
app.UseMiddleware<AdminPinAuthMiddleware>();

app.MapControllers();

app.Run();
