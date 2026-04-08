using System.Text;
using AirAware.Configuration;
using AirAware.Converters;
using AirAware.Data;
using AirAware.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MQTTnet;
using MQTTnet.Client;

namespace AirAware.Services;

/// <summary>
/// Hintergrund-Service, der sich mit dem Mosquitto-Broker verbindet,
/// auf ESP32-Sensor-Topics subscribed und eingehende Messwerte in die Datenbank schreibt.
/// Alarme werden automatisch über <see cref="AlertHelper"/> ausgewertet.
/// </summary>
public class MqttSubscriberService(
    IServiceScopeFactory scopeFactory,
    IOptions<MqttOptions> mqttOptions,
    ILogger<MqttSubscriberService> logger) : BackgroundService
{
    private IMqttClient? _mqttClient;
    private readonly MqttOptions _options = mqttOptions.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var factory = new MqttFactory();
        _mqttClient = factory.CreateMqttClient();

        _mqttClient.ApplicationMessageReceivedAsync += OnMessageReceivedAsync;
        _mqttClient.DisconnectedAsync += async e =>
        {
            if (stoppingToken.IsCancellationRequested) return;

            logger.LogWarning("MQTT-Verbindung getrennt. Reconnect in 5 Sekunden...");
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

            try
            {
                await ConnectAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "MQTT-Reconnect fehlgeschlagen.");
            }
        };

        await ConnectAsync(stoppingToken);

        // Service läuft so lange die App lebt
        await Task.Delay(Timeout.Infinite, stoppingToken);
    }

    private async Task ConnectAsync(CancellationToken ct)
    {
        var builder = new MqttClientOptionsBuilder()
            .WithTcpServer(_options.Host, _options.Port)
            .WithClientId(_options.ClientId)
            .WithCleanSession();

        if (!string.IsNullOrEmpty(_options.Username))
            builder.WithCredentials(_options.Username, _options.Password);

        var clientOptions = builder.Build();

        logger.LogInformation("Verbinde mit MQTT-Broker {Host}:{Port}...", _options.Host, _options.Port);
        await _mqttClient!.ConnectAsync(clientOptions, ct);

        var subscribeOptions = new MqttFactory().CreateSubscribeOptionsBuilder()
            .WithTopicFilter(f => f.WithTopic(_options.Topic))
            .Build();

        await _mqttClient.SubscribeAsync(subscribeOptions, ct);
        logger.LogInformation("MQTT subscribed auf Topic '{Topic}'.", _options.Topic);
    }

    private async Task OnMessageReceivedAsync(MqttApplicationMessageReceivedEventArgs e)
    {
        var payload = Encoding.UTF8.GetString(e.ApplicationMessage.PayloadSegment);
        var topic = e.ApplicationMessage.Topic;

        logger.LogDebug("MQTT-Nachricht auf '{Topic}': {Payload}", topic, payload);

        if (!SensorDataConverter.TryParse(payload, out var reading) || reading is null)
        {
            logger.LogWarning("Ungültiger MQTT-Payload auf '{Topic}': {Payload}", topic, payload);
            return;
        }

        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AirAwareDbContext>();

            db.SensorReadings.Add(reading);

            // Schwellenwerte laden und Alarme auswerten
            var thresholds = await db.AlertThresholds.ToListAsync();
            var alerts = AlertHelper.EvaluateAlerts([reading], thresholds);

            if (alerts.Count > 0)
            {
                db.Alerts.AddRange(alerts);
                logger.LogInformation("{Count} Alarm(e) ausgelöst für Sensor '{SensorId}'.",
                    alerts.Count, reading.SensorId);
            }

            await db.SaveChangesAsync();
            logger.LogInformation("Messwert gespeichert: Sensor={SensorId}, Typ={Type}, Temp={Temp}, Humidity={Humidity}",
                reading.SensorId, reading.Type, reading.TemperatureC, reading.HumidityPercent);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Fehler beim Speichern des MQTT-Messwerts.");
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        if (_mqttClient?.IsConnected == true)
        {
            await _mqttClient.DisconnectAsync(cancellationToken: cancellationToken);
            logger.LogInformation("MQTT-Verbindung getrennt.");
        }

        await base.StopAsync(cancellationToken);
    }

    public override void Dispose()
    {
        _mqttClient?.Dispose();
        base.Dispose();
        GC.SuppressFinalize(this);
    }
}
