import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faUnlock,
  faBell,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import LoginPopup from "../../components/LoginPopup/Login";
import { useAuth } from "../../context/AuthContext";
import { Endpoints } from "../../apiConfig";
import "./Settings.css";

interface Threshold {
  id: string;
  type: number;
  metricName: string;
  minValue: number;
  maxValue: number;
}

const Settings = () => {
  const { isLoggedIn, logout, token } = useAuth();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  // States für die Werte
  const [tempThreshold, setTempThreshold] = useState<Threshold | null>(null);
  const [humThreshold, setHumThreshold] = useState<Threshold | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchThresholds = async () => {
      if (!isLoggedIn || !token) return;
      setIsLoading(true);
      try {
        const response = await fetch(Endpoints.Thresholds, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data: Threshold[] = await response.json();
          const temp = data.find(
            (t) => t.metricName === "TemperatureC" || t.type === 0,
          );
          const hum = data.find(
            (t) => t.metricName === "HumidityPercent" || t.type === 1,
          );

          if (temp) setTempThreshold(temp);
          if (hum) setHumThreshold(hum);
        }
      } catch (err) {
        console.error("Fehler beim Laden der Settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThresholds();
  }, [isLoggedIn, token]);

  const handleSave = async (updatedThreshold: Threshold) => {
    if (!token) return;
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(Endpoints.Thresholds, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedThreshold),
      });

      if (response.ok) {
        setMessage("Erfolgreich gespeichert!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setError("Fehler beim Speichern im Backend.");
      }
    } catch (err) {
      setError("Netzwerkfehler beim Speichern.");
    } finally {
      setIsSaving(false);
    }
  };

  const blockInvalidChars = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
  };

  if (!isLoggedIn) {
    return (
      <div className="dashboard-container">
        <h2 className="page-title">Einstellungen</h2>
        {!showLoginPopup ? (
          <div className="locked-container">
            <FontAwesomeIcon icon={faLock} size="2x" className="locked-icon" />
            <div className="locked-text-wrapper">
              <h3 className="locked-title">Einstellungen gesperrt</h3>
              <p className="locked-description">
                Bitte melde dich an, um Schwellenwerte zu ändern.
              </p>
            </div>
            <button
              className="save-button locked-btn"
              onClick={() => setShowLoginPopup(true)}
            >
              Jetzt anmelden
            </button>
          </div>
        ) : (
          <LoginPopup
            onClose={() => setShowLoginPopup(false)}
            onSuccess={() => setShowLoginPopup(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h2 className="page-title" style={{ marginBottom: 0 }}>
          Einstellungen
        </h2>
        <button onClick={logout} className="logout-btn">
          <FontAwesomeIcon icon={faUnlock} /> Logout
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <FontAwesomeIcon icon={faSpinner} spin /> Lade Einstellungen...
        </div>
      ) : (
        <div className="tacho-card settings-card">
          <h3 className="settings-title">
            <FontAwesomeIcon
              icon={faBell}
              style={{ marginRight: "8px", color: "var(--primary-color)" }}
            />
            Zulässiger Normalbereich
          </h3>
          <p className="settings-description">
            Werte außerhalb lösen Alarme aus.
          </p>

          <div className="thresholds-container">
            <div className="threshold-group">
              <label className="threshold-label">Temperatur (°C)</label>
              <div className="threshold-inputs">
                <div className="input-wrapper">
                  <span className="input-prefix">Min</span>
                  <input
                    type="number"
                    value={tempThreshold?.minValue || ""}
                    onChange={(e) =>
                      setTempThreshold((prev) =>
                        prev
                          ? { ...prev, minValue: Number(e.target.value) }
                          : null,
                      )
                    }
                    onKeyDown={blockInvalidChars}
                    onBlur={() => tempThreshold && handleSave(tempThreshold)}
                    className="threshold-input"
                  />
                </div>
                <div className="input-wrapper">
                  <span className="input-prefix">Max</span>
                  <input
                    type="number"
                    value={tempThreshold?.maxValue || ""}
                    onChange={(e) =>
                      setTempThreshold((prev) =>
                        prev
                          ? { ...prev, maxValue: Number(e.target.value) }
                          : null,
                      )
                    }
                    onKeyDown={blockInvalidChars}
                    onBlur={() => tempThreshold && handleSave(tempThreshold)}
                    className="threshold-input"
                  />
                </div>
              </div>
            </div>

            <div className="threshold-group">
              <label className="threshold-label">Luftfeuchtigkeit (%)</label>
              <div className="threshold-inputs">
                <div className="input-wrapper">
                  <span className="input-prefix">Min</span>
                  <input
                    type="number"
                    value={humThreshold?.minValue || ""}
                    onChange={(e) =>
                      setHumThreshold((prev) =>
                        prev
                          ? { ...prev, minValue: Number(e.target.value) }
                          : null,
                      )
                    }
                    onKeyDown={blockInvalidChars}
                    onBlur={() => humThreshold && handleSave(humThreshold)}
                    className="threshold-input"
                  />
                </div>
                <div className="input-wrapper">
                  <span className="input-prefix">Max</span>
                  <input
                    type="number"
                    value={humThreshold?.maxValue || ""}
                    onChange={(e) =>
                      setHumThreshold((prev) =>
                        prev
                          ? { ...prev, maxValue: Number(e.target.value) }
                          : null,
                      )
                    }
                    onKeyDown={blockInvalidChars}
                    onBlur={() => humThreshold && handleSave(humThreshold)}
                    className="threshold-input"
                  />
                </div>
              </div>
            </div>

            {message && <span className="save-message">{message}</span>}
            {error && <span className="error-message">{error}</span>}
            {isSaving && (
              <span className="loading-message">Speichere im Backend...</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
