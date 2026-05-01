import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCheck,
  faCheckCircle,
  faCheckDouble,
} from "@fortawesome/free-solid-svg-icons";
import { useSensorData } from "../../context/SensorContext";
import { Endpoints } from "../../apiConfig";
import { useAuth } from "../../context/AuthContext";
import Toast from "../Toast/Toast";
import { Link } from "react-router-dom";

import "./NotificationBell.css";

interface ApiAlert {
  id: string;
  message: string;
  triggeredAt: string;
  isRead?: boolean;
}

const getLocalReadIds = (): string[] =>
  JSON.parse(localStorage.getItem("read_alarms") || "[]");
const getReadUntil = (): number =>
  Number(localStorage.getItem("alarms_read_until") || "0");

const isAlarmRead = (alarm: ApiAlert) => {
  const readIds = getLocalReadIds();
  const readUntil = getReadUntil();
  const alarmTime = new Date(alarm.triggeredAt).getTime();
  return readIds.includes(alarm.id) || alarmTime <= readUntil;
};

const fixEncoding = (text: string) => {
  if (!text) return text;
  let fixed = text.replace(/[\uFFFD]/g, " ");
  fixed = fixed.replace(/au\s*erhalb/g, "außerhalb");
  fixed = fixed.replace(/\[(\d+)\s*[,]?\s*(\d+)\]/g, "[$1 - $2]");
  return fixed;
};

const NotificationBell = () => {
  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [livePopup, setLivePopup] = useState<ApiAlert | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastSeenAlertId = useRef<string | null>(null);
  const { token, isLoggedIn } = useAuth();
  const { refreshInterval } = useSensorData();

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

  const fetchAlerts = async () => {
    if (!token || !isLoggedIn) return;
    try {
      const response = await fetch(Endpoints.Alerts, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data: ApiAlert[] = await response.json();

        const sortedData = data.sort(
          (a, b) =>
            new Date(b.triggeredAt).getTime() -
            new Date(a.triggeredAt).getTime(),
        );

        const uniqueAlarms = new Map<string, ApiAlert>();
        for (const alarm of sortedData) {
          const cleanMsg = fixEncoding(alarm.message);
          if (!uniqueAlarms.has(cleanMsg)) {
            uniqueAlarms.set(cleanMsg, alarm);
          }
        }

        // NUR UNGELESENE in der Glocke behalten
        const processedData = Array.from(uniqueAlarms.values())
          .map((a) => ({
            ...a,
            isRead: isAlarmRead(a),
          }))
          .filter((a) => !a.isRead);

        if (processedData.length > 0) {
          const newest = processedData[0];
          if (
            lastSeenAlertId.current !== null &&
            lastSeenAlertId.current !== newest.id
          ) {
            setLivePopup(newest);
          }
          lastSeenAlertId.current = newest.id;
        }
        setAlerts(processedData);
      }
    } catch (error) {
      console.error("Fehler beim Abrufen der Glocken-Alarme:", error);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const intervalId = setInterval(fetchAlerts, refreshInterval);

    const handleSync = () => {
      // Filtere die Alerts nochmal frisch aus
      setAlerts((prevAlerts) =>
        prevAlerts
          .map((a) => ({ ...a, isRead: isAlarmRead(a) }))
          .filter((a) => !a.isRead),
      );
    };

    window.addEventListener("sync_alarms", handleSync);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("sync_alarms", handleSync);
    };
  }, [token, isLoggedIn, refreshInterval]);

  const markAsRead = (id: string) => {
    const readIds = getLocalReadIds();
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem("read_alarms", JSON.stringify(readIds));
    }
    // Alarm sofort aus der Glocke werfen!
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    window.dispatchEvent(new Event("sync_alarms"));
  };

  const markAllAsRead = () => {
    const now = new Date().getTime();
    localStorage.setItem("alarms_read_until", now.toString());
    // Alle aus der Glocke werfen
    setAlerts([]);
    window.dispatchEvent(new Event("sync_alarms"));
  };

  const unreadCount = alerts.length;

  if (!isLoggedIn) return null;

  return (
    <>
      {livePopup && (
        <Toast
          message={fixEncoding(livePopup.message)}
          type="error"
          onClose={() => setLivePopup(null)}
        />
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
            <div
              className="notification-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Benachrichtigungen ({unreadCount})</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary-color)",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                  }}
                >
                  <FontAwesomeIcon icon={faCheckDouble} /> Alle lesen
                </button>
              )}
            </div>

            <div className="alert-list">
              {alerts.length === 0 ? (
                <div className="empty-bell-state">
                  <div className="empty-bell-icon-wrapper">
                    <FontAwesomeIcon
                      icon={faCheckCircle}
                      className="empty-bell-icon"
                    />
                  </div>
                  <h4>Alles im grünen Bereich!</h4>
                  <p>Aktuell gibt es keine neuen Warnungen.</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="alert-item unread">
                    <div
                      className="alert-content"
                      onClick={() => markAsRead(alert.id)}
                    >
                      <div className="alert-time">
                        {new Date(alert.triggeredAt).toLocaleTimeString(
                          "de-DE",
                          { hour: "2-digit", minute: "2-digit" },
                        )}{" "}
                        Uhr
                      </div>
                      <div className="alert-message">
                        {fixEncoding(alert.message)}
                      </div>
                    </div>

                    <div className="alert-actions-group">
                      <button
                        className="alert-action-btn action-check-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(alert.id);
                        }}
                        title="Erledigt"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="notification-footer">
              <Link to="/alarms" onClick={() => setIsOpen(false)}>
                Alarm-Archiv öffnen &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationBell;
