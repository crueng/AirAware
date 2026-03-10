using AirAware.Models;

namespace AirAware.Helpers;

public static class AlertHelper
{
    /// <summary>
    /// Prüft Messwerte gegen Schwellenwerte und gibt ausgelöste Alarme zurück.
    /// nurzung unf aufruf im Controller unter /Controllers/AlertController.cs
    /// </summary>
    public static List<Alert> EvaluateAlerts(List<SensorReading> readings, List<AlertThreshold> thresholds)
    {
        var alerts = new List<Alert>();

        foreach (var reading in readings)
        {
            foreach (var threshold in thresholds.Where(t => t.Type == reading.Type))
            {
                double? value = threshold.MetricName switch
                {
                    "TemperatureC" => reading.TemperatureC,
                    "HumidityPercent" => reading.HumidityPercent,
                    _ => null
                };

                if (value.HasValue && (value.Value < threshold.MinValue || value.Value > threshold.MaxValue))
                {
                    alerts.Add(new Alert
                    {
                        Reading = reading,
                        Threshold = threshold,
                        Message = $"{threshold.MetricName} = {value.Value} liegt außerhalb des Bereichs [{threshold.MinValue} – {threshold.MaxValue}]",
                        TriggeredAt = reading.Timestamp
                    });
                }
            }
        }

        return alerts;
    }
}
