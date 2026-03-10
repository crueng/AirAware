using AirAware.Data;
using AirAware.Helpers;
using AirAware.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AirAware.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SensorDataController(AirAwareDbContext db) : ControllerBase
{
    private static readonly HashSet<string> ValidMetricNames = ["TemperatureC", "HumidityPercent"];

    //  Endpoints 

    /// <summary>
    /// Gibt die neuesten Messwerte pro Sensortyp zurück.
    /// </summary>
    [HttpGet("latest")]
    public async Task<ActionResult<IEnumerable<SensorReading>>> GetLatest()
    {
        var latest = await db.SensorReadings
            .GroupBy(r => r.Type)
            .Select(g => g.OrderByDescending(r => r.Timestamp).First())
            .ToListAsync();

        return Ok(latest);
    }

    /// <summary>
    /// Gibt die Messhistorie zurück, optional gefiltert nach Sensortyp in api swagger als Dropdown gelöst.
    /// </summary>
    [HttpGet("history")]
    public async Task<ActionResult<IEnumerable<SensorReading>>> GetHistory(
        [FromQuery] SensorType? type = null,
        [FromQuery] int count = 50)
    {
        IQueryable<SensorReading> query = db.SensorReadings
            .OrderByDescending(r => r.Timestamp);

        if (type.HasValue)
            query = query.Where(r => r.Type == type.Value);

        var result = await query.Take(count).ToListAsync();
        return Ok(result);
    }

    /// <summary>
    /// Erstellt einen zusammenfassenden Bericht über die Mock-Daten. evt insteressant für den csv export oder die Anzeige in der UI für graphen oder so. 
    ///Inklusive Durchschnitt, Min/Max und Anzahl der Alarme basierend auf den Schwellenwerten.
    /// </summary>
    [HttpGet("report")]
    public async Task<ActionResult<SensorReport>> GetReport()
    {
        var readings = await db.SensorReadings.ToListAsync();

        if (readings.Count == 0)
            return Ok(new SensorReport());

        var temps = readings.Where(r => r.Type == SensorType.Temperature).ToList();
        var humids = readings.Where(r => r.Type == SensorType.Humidity).ToList();
        var thresholds = await db.AlertThresholds.ToListAsync();

        var report = new SensorReport
        {
            From = readings.Min(r => r.Timestamp),
            To = readings.Max(r => r.Timestamp),
            TotalReadings = readings.Count,

            AvgTemperatureC = temps.Count > 0 ? temps.Average(r => r.TemperatureC) : null,
            MinTemperatureC = temps.Count > 0 ? temps.Min(r => r.TemperatureC) : null,
            MaxTemperatureC = temps.Count > 0 ? temps.Max(r => r.TemperatureC) : null,

            AvgHumidityPercent = humids.Count > 0 ? humids.Average(r => r.HumidityPercent) : null,
            MinHumidityPercent = humids.Count > 0 ? humids.Min(r => r.HumidityPercent) : null,
            MaxHumidityPercent = humids.Count > 0 ? humids.Max(r => r.HumidityPercent) : null,

            AlertCount = AlertHelper.EvaluateAlerts(readings, thresholds).Count
        };

        return Ok(report);
    }

    /// <summary>
    /// Gibt die aktuellen Schwellenwerte zurück die der User erstellt hat (kann gerne getestet werden letzer wert → der Post command den man ausführt)
    /// </summary>
    [HttpGet("thresholds")]
    public async Task<ActionResult<IEnumerable<AlertThreshold>>> GetThresholds()
        => Ok(await db.AlertThresholds.ToListAsync());

    /// <summary>
    /// Setzt oder aktualisiert einen Schwellenwert.
    /// Wenn bereits ein Threshold für die gleiche Metrik existiert, wird er überschrieben.
    /// </summary>
    [HttpPost("thresholds")]
    public async Task<ActionResult<AlertThreshold>> SetThreshold([FromBody] AlertThreshold threshold)
    {
        if (!ValidMetricNames.Contains(threshold.MetricName))
            return BadRequest($"Ungültiger MetricName. Erlaubt: {string.Join(", ", ValidMetricNames)}");

        if (threshold.MinValue >= threshold.MaxValue)
            return BadRequest("MinValue muss kleiner als MaxValue sein.");

        var existing = await db.AlertThresholds
            .FirstOrDefaultAsync(t => t.MetricName == threshold.MetricName);

        if (existing is not null)
        {
            existing.Type = threshold.Type;
            existing.MinValue = threshold.MinValue;
            existing.MaxValue = threshold.MaxValue;
        }
        else
        {
            db.AlertThresholds.Add(threshold);
        }

        await db.SaveChangesAsync();
        return Ok(existing ?? threshold);
    }

    /// <summary>
    /// Prüft die Messdaten gegen die Schwellenwerte und gibt ausgelöste Alarme zurück.
    /// </summary>
    [HttpGet("alerts")]
    public async Task<ActionResult<IEnumerable<Alert>>> GetAlerts()
    {
        var readings = await db.SensorReadings.ToListAsync();
        var thresholds = await db.AlertThresholds.ToListAsync();
        var alerts = AlertHelper.EvaluateAlerts(readings, thresholds);
        return Ok(alerts);
    }
}
