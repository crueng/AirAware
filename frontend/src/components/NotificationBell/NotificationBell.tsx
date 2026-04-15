import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faExclamationTriangle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { Endpoints } from "../../apiConfig";
import { useAuth } from "../../context/AuthContext";
import "./NotificationBell.css";

interface Reading {
  temperatureC: number | null;
  humidityPercent: number | null;
}

interface Threshold {
  minValue: number;
  maxValue: number;
}

interface Alert {
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

const NotificationBell = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [livePopup, setLivePopup] = useState<Alert | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastSeenAlertId = useRef<string | null>(null);

  const { token, isLoggedIn } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!token) return;

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

          const processedData: Alert[] = data
            .filter((a: Alert) => !deletedIds.includes(a.id))
            .map((a: Alert) => ({
              ...a,
              isRead: a.isRead || readIds.includes(a.id),
            }))
            .sort(
              (a: Alert, b: Alert) =>
                new Date(b.triggeredAt).getTime() -
                new Date(a.triggeredAt).getTime(),
            );

          if (processedData.length > 0) {
            const newest = processedData[0];
            if (
              lastSeenAlertId.current !== null &&
              lastSeenAlertId.current !== newest.id &&
              !newest.isRead
            ) {
              setLivePopup(newest);
              setTimeout(() => setLivePopup(null), 8000);
            }
            lastSeenAlertId.current = newest.id;
          }

          setAlerts(processedData);
        }
      } catch (error) {
        console.error("Fehler beim Abrufen der Glocken-Alarme:", error);
      }
    };

    if (isLoggedIn) fetchAlerts();

    const interval = setInterval(() => {
      if (isLoggedIn) fetchAlerts();
    }, 15000);

    return () => clearInterval(interval);
  }, [token, isLoggedIn]);

  const markAsRead = (id: string) => {
    const readIds = getLocalReadIds();
    if (!readIds.includes(id)) {
      localStorage.setItem("read_alarms", JSON.stringify([...readIds, id]));
    }
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
    );
  };

  const removeAlert = (id: string) => {
    const deletedIds = getLocalDeletedIds();
    if (!deletedIds.includes(id)) {
      localStorage.setItem(
        "deleted_alarms",
        JSON.stringify([...deletedIds, id]),
      );
    }
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const formatAlarmText = (alert: Alert) => {
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

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  if (!isLoggedIn) return null;

  return (
    <>
      {livePopup && (
        <div
          className="alarm-popup"
          onClick={() => {
            markAsRead(livePopup.id);
            setLivePopup(null);
            setIsOpen(true);
          }}
        >
          <div className="popup-header-row">
            <div className="popup-title">
              <FontAwesomeIcon icon={faExclamationTriangle} /> Neuer
              Sensor-Alarm!
            </div>
            <button
              className="popup-close-btn"
              onClick={(e) => {
                e.stopPropagation();
                setLivePopup(null);
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="popup-message">{formatAlarmText(livePopup)}</div>
        </div>
      )}

      <div className="notification-container" ref={dropdownRef}>
        <button className="bell-button" onClick={() => setIsOpen(!isOpen)}>
          <FontAwesomeIcon icon={faBell} />
          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="notification-dropdown">
            <div className="notification-header">
              Benachrichtigungen ({unreadCount} neu)
            </div>

            <div className="alert-list">
              {alerts.length === 0 ? (
                <div className="empty-state-text">Keine Alarme vorhanden.</div>
              ) : (
                alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={`alert-item ${!alert.isRead ? "unread" : ""}`}
                    onClick={() => markAsRead(alert.id)}
                  >
                    <div className="alert-content">
                      <div className="alert-time">
                        {new Date(alert.triggeredAt).toLocaleTimeString(
                          "de-DE",
                          { hour: "2-digit", minute: "2-digit" },
                        )}{" "}
                        Uhr
                      </div>
                      <div className="alert-message">
                        {formatAlarmText(alert)}
                      </div>
                    </div>
                    <button
                      className="alert-close-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAlert(alert.id);
                      }}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="notification-footer">
              <a href="/alarms">Alle Alarme anzeigen &rarr;</a>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationBell;
