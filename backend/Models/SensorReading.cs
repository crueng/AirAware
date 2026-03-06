namespace AirAware.Models;

public enum SensorType
{
    Temperature,
    Humidity
}

/// <summary>
/// Einzelne Sensormessung vom ESP32.
/// </summary>
public class SensorReading
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string SensorId { get; set; } = string.Empty;
    public SensorType Type { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>Temperatur in °C (nur bei <see cref="SensorType.Temperature"/>).</summary>
    public double? TemperatureC { get; set; }

    /// <summary>Berechnete Temperatur in °F.
    /// Für unsere Amerikanischen Freunde grr
    /// </summary> 
    public double? TemperatureF => TemperatureC.HasValue ? 32 + TemperatureC.Value * 9.0 / 5.0 : null;

    /// <summary>Relative Luftfeuchtigkeit in % (nur bei <see cref="SensorType.Humidity"/>).</summary>
    public double? HumidityPercent { get; set; }
}

/// <summary>
/// Schwellenwert-Konfiguration für die Alarmfunktion. Ist zum selber setzen in Posti
/// </summary>
public class AlertThreshold
{
    public SensorType Type { get; set; }
    public string MetricName { get; set; } = string.Empty;
    public double MinValue { get; set; }
    public double MaxValue { get; set; }
}

/// <summary>
/// Alarm, der bei Überschreitung eines Schwellenwerts ausgelöst wird. (Aktuell mit vielen Mock-Daten gefillt)
/// </summary>
public class Alert
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public SensorReading Reading { get; set; } = null!;
    public AlertThreshold Threshold { get; set; } = null!;
    public string Message { get; set; } = string.Empty;
    public DateTime TriggeredAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Zusammenfassender Bericht über einen Zeitraum. Dient nur als Format
/// </summary>
public class SensorReport
{
    public DateTime From { get; set; }
    public DateTime To { get; set; }
    public int TotalReadings { get; set; }

    public double? AvgTemperatureC { get; set; }
    public double? MinTemperatureC { get; set; }
    public double? MaxTemperatureC { get; set; }

    public double? AvgHumidityPercent { get; set; }
    public double? MinHumidityPercent { get; set; }
    public double? MaxHumidityPercent { get; set; }

    public int AlertCount { get; set; }
}
