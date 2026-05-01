import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTemperatureHigh,
  faTint,
  faExclamationTriangle,
  faCheckDouble,
  faCheck,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { Endpoints } from "../../apiConfig";
import { useAuth } from "../../context/AuthContext";
import { useSensorData } from "../../context/SensorContext";
import "./Alarm.css";
import SingleDatePicker from "../../components/SingleDatePicker/SingleDatePicker";

interface ApiAlert {
  id: string;
  message: string;
  triggeredAt: string;
  threshold?: {
    metricName: string;
  };
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

const Alarms = () => {
  const [alarms, setAlarms] = useState<ApiAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const { token, isLoggedIn } = useAuth();
  const { refreshInterval } = useSensorData();

  const fetchAlarms = async (isBackgroundFetch = false) => {
    if (!token || !isLoggedIn) return;

    if (!isBackgroundFetch) setIsLoading(true);

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

        const processedData = Array.from(uniqueAlarms.values()).map((a) => ({
          ...a,
          isRead: isAlarmRead(a),
        }));

        setAlarms(processedData);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Alarme:", error);
    } finally {
      if (!isBackgroundFetch) {
        setTimeout(() => setIsLoading(false), 500);
      }
    }
  };

  useEffect(() => {
    fetchAlarms(false);

    const intervalId = setInterval(() => {
      fetchAlarms(true);
    }, refreshInterval);

    const handleSync = () => {
      setAlarms((prevAlarms) =>
        prevAlarms.map((a) => ({
          ...a,
          isRead: isAlarmRead(a),
        })),
      );
    };

    window.addEventListener("sync_alarms", handleSync);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("sync_alarms", handleSync);
    };
  }, [token, isLoggedIn, refreshInterval]);

  const displayedAlarms = alarms.filter((alarm) => {
    if (!selectedDate) return true;

    const d = new Date(alarm.triggeredAt);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const alarmDateString = `${yyyy}-${mm}-${dd}`;

    return alarmDateString === selectedDate;
  });

  const tempAlertsCount = displayedAlarms.filter(
    (a) =>
      a.threshold?.metricName === "TemperatureC" ||
      a.message.includes("TemperatureC"),
  ).length;
  const humAlertsCount = displayedAlarms.filter(
    (a) =>
      a.threshold?.metricName !== "TemperatureC" &&
      !a.message.includes("TemperatureC"),
  ).length;
  const unreadCount = displayedAlarms.filter((a) => !a.isRead).length;

  const markAllAsRead = () => {
    const now = new Date().getTime();
    localStorage.setItem("alarms_read_until", now.toString());
    setAlarms((prev) => prev.map((a) => ({ ...a, isRead: true })));
    window.dispatchEvent(new Event("sync_alarms"));
  };

  const markAsRead = (id: string) => {
    const readIds = getLocalReadIds();
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem("read_alarms", JSON.stringify(readIds));
    }
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
    );
    window.dispatchEvent(new Event("sync_alarms"));
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="alarms-header-row">
          <h2 className="page-title">Alarm-Archiv</h2>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "400px",
            width: "100%",
            backgroundColor: "white",
            borderRadius: "16px",
            border: "1px solid var(--navy-100)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
          }}
        >
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            style={{
              fontSize: "2rem",
              color: "var(--primary-color)",
              marginBottom: "1rem",
            }}
          />
          <p style={{ color: "var(--gray-500)", fontWeight: 500 }}>
            Lade Archiv...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div
        className="alarms-header-row"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 className="page-title" style={{ margin: 0 }}>
          Alarm-Archiv
        </h2>

        <div
          className="alarms-controls"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          <SingleDatePicker
            selectedDate={selectedDate}
            onChange={setSelectedDate}
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate("")}
              style={{
                background: "white",
                border: "1px solid var(--navy-100)",
                padding: "0.6rem 1rem",
                borderRadius: "8px",
                cursor: "pointer",
                color: "var(--gray-600)",
              }}
            >
              Filter aufheben
            </button>
          )}

          {unreadCount > 0 && (
            <button className="mark-read-btn" onClick={markAllAsRead}>
              <FontAwesomeIcon icon={faCheckDouble} /> Alle als gelesen
              markieren
            </button>
          )}
        </div>
      </div>

      <div className="alarm-stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon-wrapper total-icon">
            <FontAwesomeIcon icon={faExclamationTriangle} size="lg" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Ungelesene Alarme</span>
            <span className="stat-value">{unreadCount}</span>
          </div>
        </div>
        <div className="stat-card stat-temp">
          <div className="stat-icon-wrapper temp-icon">
            <FontAwesomeIcon icon={faTemperatureHigh} size="lg" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Temperatur-Alarme</span>
            <span className="stat-value">{tempAlertsCount}</span>
          </div>
        </div>
        <div className="stat-card stat-hum">
          <div className="stat-icon-wrapper hum-icon">
            <FontAwesomeIcon icon={faTint} size="lg" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Luftfeuchtigkeits-Alarme</span>
            <span className="stat-value">{humAlertsCount}</span>
          </div>
        </div>
      </div>

      <div className="alarms-list-wrapper">
        <h3 className="page-title list-section-title">
          {selectedDate
            ? `Benachrichtigungen für ${new Date(selectedDate).toLocaleDateString("de-DE")}`
            : "Gesamte Historie"}
        </h3>

        <div className="alarms-list">
          {displayedAlarms.length === 0 ? (
            <div className="empty-state">
              {selectedDate
                ? "An diesem Tag gab es keine Alarme."
                : "Keine Alarme im System vorhanden."}
            </div>
          ) : (
            displayedAlarms.map((alarm) => {
              const isTemp =
                alarm.threshold?.metricName === "TemperatureC" ||
                alarm.message.includes("TemperatureC");

              return (
                <div
                  key={alarm.id}
                  className={`alarm-row ${!alarm.isRead ? "unread-row" : ""}`}
                >
                  <div
                    className={`alarm-row-icon ${isTemp ? "temperature" : "humidity"}`}
                  >
                    <FontAwesomeIcon
                      icon={isTemp ? faTemperatureHigh : faTint}
                    />
                  </div>
                  <div className="alarm-row-content">
                    <div className="alarm-row-message">
                      {fixEncoding(alarm.message)}
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

                  <div className="alarm-actions">
                    {!alarm.isRead && (
                      <button
                        className="alarm-action-btn check-btn"
                        onClick={() => markAsRead(alarm.id)}
                        title="Als gelesen markieren"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Alarms;
