using AirAware.Models;
using Microsoft.Extensions.Options;
using Telegram.Bot;

namespace AirAware.TelegramBot;

/// <summary>
/// Service zum Versenden von Alert-Nachrichten über Telegram.
/// </summary>
public class TelegramAlertService
{
    private readonly TelegramBotClient _bot;
    private readonly string _chatId;
    private readonly ILogger<TelegramAlertService> _logger;

    public TelegramAlertService(IOptions<TelegramOptions> options, ILogger<TelegramAlertService> logger)
    {
        _bot = new TelegramBotClient(options.Value.BotToken);
        _chatId = options.Value.ChatId;
        _logger = logger;
    }

    /// <summary>
    /// Sendet eine einzelne Alert-Nachricht an den konfigurierten Telegram-Chat.
    /// </summary>
    public async Task SendAlertAsync(Alert alert)
    {
        var message = $"⚠️ *AirAware Alert*\n\n"
                    + $"*Sensor:* {alert.Reading.SensorId}\n"
                    + $"*Metrik:* {alert.Threshold.MetricName}\n"
                    + $"*Nachricht:* {alert.Message}\n"
                    + $"*Zeit:* {alert.TriggeredAt:dd.MM.yyyy HH:mm:ss} UTC";

        try
        {
            await _bot.SendMessage(_chatId, message, parseMode: Telegram.Bot.Types.Enums.ParseMode.Markdown);
            _logger.LogInformation("Telegram-Alert gesendet: {Message}", alert.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fehler beim Senden des Telegram-Alerts");
        }
    }

    /// <summary>
    /// Sendet mehrere Alerts an den konfigurierten Telegram-Chat.
    /// </summary>
    public async Task SendAlertsAsync(IEnumerable<Alert> alerts)
    {
        foreach (var alert in alerts)
        {
            await SendAlertAsync(alert);
        }
    }
}
