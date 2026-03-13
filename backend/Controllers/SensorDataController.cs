using System.Globalization;
using System.Text;
using AirAware.Attributes;
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
    /// Erstellt einen zusammenfassenden Bericht. Optional filterbar nach Zeitraum.
    /// Ohne Parameter wird über alle vorhandenen Daten berichtet.
    /// Inklusive Durchschnitt, Median, Min/Max, °F-Werte und Anzahl der Alarme.
    /// </summary>
    [HttpGet("report")]
    public async Task<ActionResult<SensorReport>> GetReport(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var report = await BuildReport(from, to);
        return Ok(report);
    }

    /// <summary>
    /// Lädt den Report als CSV-Datei herunter. Gleiche Filter wie GET /report.
    /// Enthält alle Einzelmesswerte im gewählten Zeitraum + eine Zusammenfassungszeile am Ende.
    /// </summary>
    [HttpGet("report/csv")]
    public async Task<IActionResult> GetReportCsv(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var (readings, report) = await BuildReportWithReadings(from, to);

        var sb = new StringBuilder();
        sb.AppendLine("Id;SensorId;Type;Timestamp;TemperatureC;TemperatureF;HumidityPercent");

        foreach (var r in readings.OrderBy(r => r.Timestamp))
        {
            sb.AppendLine(string.Join(';',
                r.Id,
                r.SensorId,
                r.Type,
                r.Timestamp.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture),
                r.TemperatureC?.ToString("F1", CultureInfo.InvariantCulture) ?? "",
                r.TemperatureF?.ToString("F1", CultureInfo.InvariantCulture) ?? "",
                r.HumidityPercent?.ToString("F1", CultureInfo.InvariantCulture) ?? ""));
        }

        // Zusammenfassung am Ende
        sb.AppendLine();
        sb.AppendLine("# Zusammenfassung");
        sb.AppendLine($"Zeitraum;{report.From:yyyy-MM-dd HH:mm:ss};bis;{report.To:yyyy-MM-dd HH:mm:ss}");
        sb.AppendLine($"Gesamt Messwerte;{report.TotalReadings}");
        sb.AppendLine($"Temperatur Messwerte;{report.TemperatureReadings}");
        sb.AppendLine($"Feuchtigkeits Messwerte;{report.HumidityReadings}");
        sb.AppendLine($"Avg Temp °C;{report.AvgTemperatureC?.ToString("F1", CultureInfo.InvariantCulture)}");
        sb.AppendLine($"Min Temp °C;{report.MinTemperatureC?.ToString("F1", CultureInfo.InvariantCulture)}");
        sb.AppendLine($"Max Temp °C;{report.MaxTemperatureC?.ToString("F1", CultureInfo.InvariantCulture)}");
        sb.AppendLine($"Median Temp °C;{report.MedianTemperatureC?.ToString("F1", CultureInfo.InvariantCulture)}");
        sb.AppendLine($"Avg Temp °F;{report.AvgTemperatureF?.ToString("F1", CultureInfo.InvariantCulture)}");
        sb.AppendLine($"Avg Feuchte %;{report.AvgHumidityPercent?.ToString("F1", CultureInfo.InvariantCulture)}");
        sb.AppendLine($"Min Feuchte %;{report.MinHumidityPercent?.ToString("F1", CultureInfo.InvariantCulture)}");
        sb.AppendLine($"Max Feuchte %;{report.MaxHumidityPercent?.ToString("F1", CultureInfo.InvariantCulture)}");
        sb.AppendLine($"Median Feuchte %;{report.MedianHumidityPercent?.ToString("F1", CultureInfo.InvariantCulture)}");
        sb.AppendLine($"Alarme;{report.AlertCount}");

        var fileName = $"AirAware_Report_{report.From:yyyyMMdd}_{report.To:yyyyMMdd}.csv";
        var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        return File(bytes, "text/csv; charset=utf-8", fileName);
    }

    private async Task<SensorReport> BuildReport(DateTime? from, DateTime? to)
    {
        var (_, report) = await BuildReportWithReadings(from, to);
        return report;
    }

    private async Task<(List<SensorReading> Readings, SensorReport Report)> BuildReportWithReadings(DateTime? from, DateTime? to)
    {
        IQueryable<SensorReading> query = db.SensorReadings;

        if (from.HasValue)
            query = query.Where(r => r.Timestamp >= from.Value.ToUniversalTime());
        if (to.HasValue)
            query = query.Where(r => r.Timestamp <= to.Value.ToUniversalTime());

        var readings = await query.OrderBy(r => r.Timestamp).ToListAsync();

        if (readings.Count == 0)
            return (readings, new SensorReport
            {
                From = from?.ToUniversalTime() ?? DateTime.UtcNow,
                To = to?.ToUniversalTime() ?? DateTime.UtcNow
            });

        var temps = readings.Where(r => r.Type == SensorType.Temperature).ToList();
        var humids = readings.Where(r => r.Type == SensorType.Humidity).ToList();
        var thresholds = await db.AlertThresholds.ToListAsync();

        var report = new SensorReport
        {
            From = readings.Min(r => r.Timestamp),
            To = readings.Max(r => r.Timestamp),
            TotalReadings = readings.Count,
            TemperatureReadings = temps.Count,
            HumidityReadings = humids.Count,

            AvgTemperatureC = temps.Count > 0 ? Math.Round(temps.Average(r => r.TemperatureC!.Value), 1) : null,
            MinTemperatureC = temps.Count > 0 ? temps.Min(r => r.TemperatureC) : null,
            MaxTemperatureC = temps.Count > 0 ? temps.Max(r => r.TemperatureC) : null,
            MedianTemperatureC = temps.Count > 0 ? CalculateMedian(temps.Select(r => r.TemperatureC!.Value)) : null,

            AvgTemperatureF = temps.Count > 0 ? Math.Round(temps.Average(r => r.TemperatureF!.Value), 1) : null,
            MinTemperatureF = temps.Count > 0 ? temps.Min(r => r.TemperatureF) : null,
            MaxTemperatureF = temps.Count > 0 ? temps.Max(r => r.TemperatureF) : null,

            AvgHumidityPercent = humids.Count > 0 ? Math.Round(humids.Average(r => r.HumidityPercent!.Value), 1) : null,
            MinHumidityPercent = humids.Count > 0 ? humids.Min(r => r.HumidityPercent) : null,
            MaxHumidityPercent = humids.Count > 0 ? humids.Max(r => r.HumidityPercent) : null,
            MedianHumidityPercent = humids.Count > 0 ? CalculateMedian(humids.Select(r => r.HumidityPercent!.Value)) : null,

            AlertCount = AlertHelper.EvaluateAlerts(readings, thresholds).Count
        };

        return (readings, report);
    }

    private static double CalculateMedian(IEnumerable<double> values)
    {
        var sorted = values.OrderBy(v => v).ToList();
        int mid = sorted.Count / 2;
        return sorted.Count % 2 == 0
            ? Math.Round((sorted[mid - 1] + sorted[mid]) / 2.0, 1)
            : Math.Round(sorted[mid], 1);
    }

    /// <summary>
    /// Gibt die aktuellen Schwellenwerte zurück die der User erstellt hat (kann gerne getestet werden letzer wert → der Post command den man ausführt)
    /// </summary>
    [HttpGet("thresholds")]
    public async Task<ActionResult<IEnumerable<AlertThreshold>>> GetThresholds()
        => Ok(await db.AlertThresholds.ToListAsync());

    /// <summary>
    /// Setzt oder aktualisiert einen Schwellenwert.
    /// Pro SensorType ist nur ein Threshold erlaubt.
    /// Wenn bereits ein Threshold für den gleichen Type existiert, wird er überschrieben.
    /// Erfordert Admin-PIN im Header (X-Admin-Pin) in Production.
    /// </summary>
    [RequireAdminPin]
    [HttpPost("thresholds")]
    public async Task<ActionResult<AlertThreshold>> SetThreshold([FromBody] AlertThreshold threshold)
    {
        if (!ValidMetricNames.Contains(threshold.MetricName))
            return BadRequest($"Ungültiger MetricName. Erlaubt: {string.Join(", ", ValidMetricNames)}");

        if (threshold.MinValue >= threshold.MaxValue)
            return BadRequest("MinValue muss kleiner als MaxValue sein.");

        // Nur ein Threshold pro SensorType erlaubt
        var existing = await db.AlertThresholds
            .FirstOrDefaultAsync(t => t.Type == threshold.Type);

        if (existing is not null)
        {
            existing.MetricName = threshold.MetricName;
            existing.MinValue = threshold.MinValue;
            existing.MaxValue = threshold.MaxValue;
        }
        else
        {
            threshold.Id = Guid.NewGuid(); // Ignore any client-provided Id
            db.AlertThresholds.Add(threshold);
        }

        await db.SaveChangesAsync();
        return Ok(existing ?? threshold);
    }

    /// <summary>
    /// Löscht den Schwellenwert für einen bestimmten SensorType.
    /// Erfordert Admin-PIN im Header (X-Admin-Pin) in Production.
    /// </summary>
    [RequireAdminPin]
    [HttpDelete("thresholds/{type}")]
    public async Task<ActionResult> DeleteThreshold(SensorType type)
    {
        var existing = await db.AlertThresholds
            .FirstOrDefaultAsync(t => t.Type == type);

        if (existing is null)
            return NotFound($"Kein Threshold für Type '{type}' vorhanden.");

        db.AlertThresholds.Remove(existing);
        await db.SaveChangesAsync();
        return NoContent();
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

    //  Mock-Daten für Tests 

    /// <summary>
    /// Generiert 100 Testmessungen (50× Temperatur + 50× Luftfeuchtigkeit) über die letzten ~4 Stunden
    /// und speichert sie in die Datenbank. Sensor-ID ist "esp32-mock".
    /// Erfordert API-Key im Header (X-Api-Key) in Production.
    /// </summary>
    [RequireApiKey]
    [HttpPost("mock")]
    public async Task<ActionResult> GenerateMockData()
    {
        var rng = Random.Shared;
        var now = DateTime.UtcNow;
        var readings = new List<SensorReading>();

        for (int i = 0; i < 50; i++)
        {
            var timestamp = now.AddMinutes(-i * 5);

            readings.Add(new SensorReading
            {
                SensorId = "esp32-mock",
                Type = SensorType.Temperature,
                Timestamp = timestamp,
                TemperatureC = Math.Round(18 + rng.NextDouble() * 14, 1)
            });

            readings.Add(new SensorReading
            {
                SensorId = "esp32-mock",
                Type = SensorType.Humidity,
                Timestamp = timestamp,
                HumidityPercent = Math.Round(30 + rng.NextDouble() * 50, 1)
            });
        }

        db.SensorReadings.AddRange(readings);
        await db.SaveChangesAsync();

        return Ok(new { Message = $"{readings.Count} Mock-Messwerte erstellt.", Count = readings.Count });
    }

    /// <summary>
    /// Löscht alle Mock-Daten (sensor_id = "esp32-mock") aus der Datenbank.
    /// Echte ESP32-Daten bleiben erhalten.
    /// Erfordert API-Key im Header (X-Api-Key) in Production.
    /// </summary>
    [RequireApiKey]
    [HttpDelete("mock")]
    public async Task<ActionResult> DeleteMockData()
    {
        var mockReadings = await db.SensorReadings
            .Where(r => r.SensorId == "esp32-mock")
            .ToListAsync();

        if (mockReadings.Count == 0)
            return NotFound("Keine Mock-Daten vorhanden.");

        // Zugehörige Alerts löschen (CASCADE greift in DB, aber sicherheitshalber explizit)
        var mockReadingIds = mockReadings.Select(r => r.Id).ToHashSet();
        var relatedAlerts = await db.Alerts
            .Where(a => mockReadingIds.Contains(a.ReadingId))
            .ToListAsync();

        db.Alerts.RemoveRange(relatedAlerts);
        db.SensorReadings.RemoveRange(mockReadings);
        await db.SaveChangesAsync();

        return Ok(new { Message = $"{mockReadings.Count} Mock-Messwerte und {relatedAlerts.Count} zugehörige Alerts gelöscht." });
    }
}

