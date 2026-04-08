namespace AirAware.Configuration;

/// <summary>
/// Konfiguration für die MQTT-Verbindung zum Mosquitto-Broker.
/// Wird aus der Sektion "Mqtt" in appsettings geladen.
/// </summary>
public class MqttOptions
{
    public const string SectionName = "Mqtt";

    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 1883;
    public string Topic { get; set; } = "esp32/sensor/#";
    public string ClientId { get; set; } = "airaware-backend";
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
