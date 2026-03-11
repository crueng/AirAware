using AirAware.Helpers;
using AirAware.Models;
using Microsoft.AspNetCore.Mvc;

namespace AirAware.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SensorDataController : ControllerBase
{
    // Mock-Daten 

    private static readonly List<AlertThreshold> Thresholds =
    [
        new() { Type = SensorType.Temperature,  MetricName = "TemperatureC",    MinValue = -10, MaxValue = 40 },
        new() { Type = SensorType.Humidity,      MetricName = "HumidityPercent", MinValue = 20,  MaxValue = 80 }
    ];

    private static readonly HashSet<string> ValidMetricNames = ["TemperatureC", "HumidityPercent"];

    private static List<SensorReading> GenerateMockReadings()
    {
        var rng = Random.Shared;
        var now = DateTime.UtcNow;
        var readings = new List<SensorReading>();

        for (int i = 0; i < 50; i++)
        {
            var timestamp = now.AddMinutes(-i * 5);

            readings.Add(new SensorReading
            {
                SensorId = "esp32-01",
                Type = SensorType.Temperature,
                Timestamp = timestamp,
                TemperatureC = Math.Round(18 + rng.NextDouble() * 14, 1)
            });

            readings.Add(new SensorReading
            {
                SensorId = "esp32-01",
                Type = SensorType.Humidity,
                Timestamp = timestamp,
                HumidityPercent = Math.Round(30 + rng.NextDouble() * 50, 1)
            });
        }

        return readings;
    }

    //  Endpoints 

    /// <summary>
    /// Gibt die neuesten Messwerte pro Sensortyp zurück.
    /// </summary>
    [HttpGet("latest")]
    public ActionResult<IEnumerable<SensorReading>> GetLatest()
    {
        var readings = GenerateMockReadings();

        var latest = readings
            .GroupBy(r => r.Type)
            .Select(g => g.OrderByDescending(r => r.Timestamp).First())
            .ToList();

        return Ok(latest);
    }

    /// <summary>
    /// Gibt die Messhistorie zurück, optional gefiltert nach Sensortyp in api swagger als Dropdown gelöst.
    /// </summary>
    [HttpGet("history")]
    public ActionResult<IEnumerable<SensorReading>> GetHistory(
        [FromQuery] SensorType? type = null,
        [FromQuery] int count = 50)
    {
        var readings = GenerateMockReadings();

        IEnumerable<SensorReading> result = readings
            .OrderByDescending(r => r.Timestamp);

        if (type.HasValue)
            result = result.Where(r => r.Type == type.Value);

        return Ok(result.Take(count));
    }

    /// <summary>
    /// Erstellt einen zusammenfassenden Bericht über die Mock-Daten. evt insteressant für den csv export oder die Anzeige in der UI für graphen oder so. 
    ///Inklusive Durchschnitt, Min/Max und Anzahl der Alarme basierend auf den Schwellenwerten.
    /// </summary>
    [HttpGet("report")]
    public ActionResult<SensorReport> GetReport()
    {
        var readings = GenerateMockReadings();
        var temps = readings.Where(r => r.Type == SensorType.Temperature).ToList();
        var humids = readings.Where(r => r.Type == SensorType.Humidity).ToList();

        var report = new SensorReport
        {
            From = readings.Min(r => r.Timestamp),
            To = readings.Max(r => r.Timestamp),
            TotalReadings = readings.Count,

            AvgTemperatureC = temps.Average(r => r.TemperatureC),
            MinTemperatureC = temps.Min(r => r.TemperatureC),
            MaxTemperatureC = temps.Max(r => r.TemperatureC),

            AvgHumidityPercent = humids.Average(r => r.HumidityPercent),
            MinHumidityPercent = humids.Min(r => r.HumidityPercent),
            MaxHumidityPercent = humids.Max(r => r.HumidityPercent),

            AlertCount = AlertHelper.EvaluateAlerts(readings, Thresholds).Count
        };

        return Ok(report);
    }

    /// <summary>
    /// Gibt die aktuellen Schwellenwerte zurück die der User erstellt hat (kann gerne getestet werden letzer wert ? der Post command den man ausführt)
    /// </summary>
    [HttpGet("thresholds")]
    public ActionResult<IEnumerable<AlertThreshold>> GetThresholds() => Ok(Thresholds);

    /// <summary>
    /// Setzt oder aktualisiert einen Schwellenwert.
    /// Wenn bereits ein Threshold für die gleiche Metrik existiert, wird er überschrieben.
    /// </summary>
    [HttpPost("thresholds")]
    public ActionResult<AlertThreshold> SetThreshold([FromBody] AlertThreshold threshold)
    {
        if (!ValidMetricNames.Contains(threshold.MetricName))
            return BadRequest($"Ungültiger MetricName. Erlaubt: {string.Join(", ", ValidMetricNames)}");

        if (threshold.MinValue >= threshold.MaxValue)
            return BadRequest("MinValue muss kleiner als MaxValue sein.");

        var existing = Thresholds.FindIndex(t => t.MetricName == threshold.MetricName);
        if (existing >= 0)
            Thresholds[existing] = threshold;
        else
            Thresholds.Add(threshold);

        return Ok(threshold);
    }

    /// <summary>
    /// Prüft die Mock-Daten gegen die Schwellenwerte und gibt ausgelöste Alarme zurück.
    /// </summary>
    [HttpGet("alerts")]
    public ActionResult<IEnumerable<Alert>> GetAlerts()
    {
        var readings = GenerateMockReadings();
        var alerts = AlertHelper.EvaluateAlerts(readings, Thresholds);
        return Ok(alerts);
    }

}
