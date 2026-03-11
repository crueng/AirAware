using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AirAware.Models;

public enum SensorType
{
    Temperature,
    Humidity
}

/// <summary>
/// Einzelne Sensormessung vom ESP32.
/// </summary>
[Table("sensor_readings")]
public class SensorReading
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("sensor_id")]
    public string SensorId { get; set; } = string.Empty;

    [Column("Type")]
    public SensorType Type { get; set; }

    [Column("Timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>Temperatur in °C (nur bei <see cref="SensorType.Temperature"/>).</summary>
    [Column("temperature_c")]
    public double? TemperatureC { get; set; }

    /// <summary>Berechnete Temperatur in °F.
    /// Für unsere Amerikanischen Freunde grr
    /// </summary>
    [NotMapped]
    public double? TemperatureF => TemperatureC.HasValue ? 32 + TemperatureC.Value * 9.0 / 5.0 : null;

    /// <summary>Relative Luftfeuchtigkeit in % (nur bei <see cref="SensorType.Humidity"/>).</summary>
    [Column("humidity_percent")]
    public double? HumidityPercent { get; set; }
}

/// <summary>
/// Schwellenwert-Konfiguration für die Alarmfunktion. Ist zum selber setzen in Posti
/// </summary>
[Table("alert_thresholds")]
public class AlertThreshold
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("Type")]
    public SensorType Type { get; set; }

    [Column("metric_name")]
    public string MetricName { get; set; } = string.Empty;

    [Column("min_value")]
    public double MinValue { get; set; }

    [Column("max_value")]
    public double MaxValue { get; set; }
}

/// <summary>
/// Alarm, der bei Überschreitung eines Schwellenwerts ausgelöst wird. (Aktuell mit vielen Mock-Daten gefillt)
/// </summary>
[Table("alerts")]
public class Alert
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("reading_id")]
    public Guid ReadingId { get; set; }

    [ForeignKey(nameof(ReadingId))]
    public SensorReading Reading { get; set; } = null!;

    [Column("threshold_id")]
    public Guid ThresholdId { get; set; }

    [ForeignKey(nameof(ThresholdId))]
    public AlertThreshold Threshold { get; set; } = null!;

    [Column("Message")]
    public string Message { get; set; } = string.Empty;

    [Column("triggered_at")]
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
    public int TemperatureReadings { get; set; }
    public int HumidityReadings { get; set; }

    public double? AvgTemperatureC { get; set; }
    public double? MinTemperatureC { get; set; }
    public double? MaxTemperatureC { get; set; }
    public double? MedianTemperatureC { get; set; }

    /// <summary>Berechnete °F-Werte für unsere Amerikanischen Freunde.</summary>
    public double? AvgTemperatureF { get; set; }
    public double? MinTemperatureF { get; set; }
    public double? MaxTemperatureF { get; set; }

    public double? AvgHumidityPercent { get; set; }
    public double? MinHumidityPercent { get; set; }
    public double? MaxHumidityPercent { get; set; }
    public double? MedianHumidityPercent { get; set; }

    public int AlertCount { get; set; }
}
