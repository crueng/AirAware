import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTemperatureHigh,
  faTint,
  faExclamationTriangle,
  faCheckDouble,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { Endpoints } from "../../apiConfig";
import { useAuth } from "../../context/AuthContext";
import "./Alarm.css";

interface Reading {
  temperatureC: number | null;
  humidityPercent: number | null;
}

interface Threshold {
  minValue: number;
  maxValue: number;
}

interface Alarm {
  id: string;
  triggeredAt: string;
  reading: Reading;
  threshold: Threshold;
  isRead?: boolean;
}

const getLocalReadIds = (): string[] =>
  JSON.parse(localStorage.getItem("read_alarms") || "[]");
const getLocalDeletedIds = (): string[] =>
  JSON.parse(localStorage.getItem("deleted_alarms") || "[]");

const Alarms = () => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchRealAlarms = async () => {
      try {
        const response = await fetch(Endpoints.Alerts, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data: any[] = await response.json();
          const readIds = getLocalReadIds();
          const deletedIds = getLocalDeletedIds();

          const processedData: Alarm[] = data
            .filter((a: Alarm) => !deletedIds.includes(a.id))
            .map((a: Alarm) => ({
              ...a,
              isRead: a.isRead || readIds.includes(a.id),
            }))
            .sort(
              (a: Alarm, b: Alarm) =>
                new Date(b.triggeredAt).getTime() -
                new Date(a.triggeredAt).getTime(),
            );

          setAlarms(processedData);
        } else {
          console.error("Fehler beim Laden. Status:", response.status);
        }
      } catch (error) {
        console.error("Netzwerkfehler:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchRealAlarms();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const tempAlertsCount = alarms.filter(
    (a) => a.reading.temperatureC !== null,
  ).length;
  const humAlertsCount = alarms.filter(
    (a) => a.reading.humidityPercent !== null,
  ).length;
  const unreadCount = alarms.filter((a) => !a.isRead).length;

  const markAllAsRead = () => {
    const readIds = getLocalReadIds();
    const newAlarms = alarms.map((alarm) => {
      if (!readIds.includes(alarm.id)) readIds.push(alarm.id);
      return { ...alarm, isRead: true };
    });
    localStorage.setItem("read_alarms", JSON.stringify(readIds));
    setAlarms(newAlarms);
  };

  const removeAlarm = (id: string) => {
    const deletedIds = getLocalDeletedIds();
    if (!deletedIds.includes(id)) {
      localStorage.setItem(
        "deleted_alarms",
        JSON.stringify([...deletedIds, id]),
      );
    }
    setAlarms(alarms.filter((alarm) => alarm.id !== id));
  };

  const formatAlarmText = (alert: Alarm) => {
    const temp = alert.reading.temperatureC;
    const hum = alert.reading.humidityPercent;
    const min = alert.threshold.minValue;
    const max = alert.threshold.maxValue;

    if (temp !== null) {
      return `Temperatur: ${temp}°C liegt außerhalb des Bereichs (${min}°C - ${max}°C)`;
    } else if (hum !== null) {
      return `Luftfeuchtigkeit: ${hum}% liegt außerhalb des Bereichs (${min}% - ${max}%)`;
    }
    return "Unbekannter Sensorwert";
  };

  return (
    <div className="dashboard-container">
      <div className="alarms-header-row">
        <h2 className="page-title">Alarm-Übersicht</h2>
        {unreadCount > 0 && (
          <button className="mark-read-btn" onClick={markAllAsRead}>
            <FontAwesomeIcon icon={faCheckDouble} /> Alle als gelesen markieren
          </button>
        )}
      </div>

      <div className="alarm-stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon-wrapper total-icon">
            <FontAwesomeIcon icon={faExclamationTriangle} size="lg" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Ungelesene Alarme</span>
            <span className="stat-value">
              {isLoading ? "..." : unreadCount}
            </span>
          </div>
        </div>

        <div className="stat-card stat-temp">
          <div className="stat-icon-wrapper temp-icon">
            <FontAwesomeIcon icon={faTemperatureHigh} size="lg" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Temperatur-Alarme (Gesamt)</span>
            <span className="stat-value">
              {isLoading ? "..." : tempAlertsCount}
            </span>
          </div>
        </div>

        <div className="stat-card stat-hum">
          <div className="stat-icon-wrapper hum-icon">
            <FontAwesomeIcon icon={faTint} size="lg" />
          </div>
          <div className="stat-info">
            <span className="stat-label">
              Luftfeuchtigkeits-Alarme (Gesamt)
            </span>
            <span className="stat-value">
              {isLoading ? "..." : humAlertsCount}
            </span>
          </div>
        </div>
      </div>

      <div className="tacho-card alarms-list-card">
        <h3 className="settings-title">Alle Benachrichtigungen</h3>

        <div className="alarms-list">
          {isLoading ? (
            <div className="empty-state">Lade Alarme aus der Datenbank...</div>
          ) : alarms.length === 0 ? (
            <div className="empty-state">Keine Alarme im System vorhanden.</div>
          ) : (
            alarms.map((alarm) => (
              <div
                key={alarm.id}
                className={`alarm-row ${!alarm.isRead ? "unread-row" : ""}`}
              >
                <div
                  className={`alarm-row-icon ${alarm.reading.temperatureC !== null ? "temperature" : "humidity"}`}
                >
                  <FontAwesomeIcon
                    icon={
                      alarm.reading.temperatureC !== null
                        ? faTemperatureHigh
                        : faTint
                    }
                  />
                </div>

                <div className="alarm-row-content">
                  <div className="alarm-row-message">
                    {formatAlarmText(alarm)}
                  </div>
                  <div className="alarm-row-time">
                    {new Date(alarm.triggeredAt).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}{" "}
                    um{" "}
                    {new Date(alarm.triggeredAt).toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    Uhr
                  </div>
                </div>

                <button
                  className="alarm-delete-btn"
                  onClick={() => removeAlarm(alarm.id)}
                  title="Alarm löschen"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Alarms;
