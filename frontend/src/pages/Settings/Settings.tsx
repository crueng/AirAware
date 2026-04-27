import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faUnlock,
  faBell,
  faSpinner,
  faClock 
} from "@fortawesome/free-solid-svg-icons";
import LoginPopup from "../../components/LoginPopup/Login";
import CustomDropdown from "../../components/CustomDropdown/CustomDropdown";
import RegisterUser from "../../components/RegisterUser/RegisterUser"; 
import CustomButton from "../../components/CustomButton/CustomButton";
import { useAuth } from "../../context/AuthContext";
import { useSensorData } from "../../context/SensorContext"; 
import { Endpoints } from "../../apiConfig";
import "./Settings.css";

interface Threshold {
  id: string;
  type: number;
  metricName: string;
  minValue: number;
  maxValue: number;
}

const defaultTemp: Threshold = {
  id: "00000000-0000-0000-0000-000000000000",
  type: 0,
  metricName: "TemperatureC",
  minValue: 10,
  maxValue: 40
};

const defaultHum: Threshold = {
  id: "00000000-0000-0000-0000-000000000000",
  type: 1,
  metricName: "HumidityPercent",
  minValue: 20,
  maxValue: 80
};

const INTERVAL_OPTIONS = [
  { value: 5000, label: "5 Sekunden" },
  { value: 10000, label: "10 Sekunden" },
  { value: 30000, label: "30 Sekunden" },
  { value: 60000, label: "1 Minute" },
];

const Settings = () => {
  const { isLoggedIn, logout, token } = useAuth();
  const { refreshInterval, setRefreshInterval } = useSensorData(); 
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [tempThreshold, setTempThreshold] = useState<Threshold>(defaultTemp);
  const [humThreshold, setHumThreshold] = useState<Threshold>(defaultHum);
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
          
          const temp = data.find((t) => t.metricName === "TemperatureC" || t.type === 0);
          const hum = data.find((t) => t.metricName === "HumidityPercent" || t.type === 1);

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
        const savedData = await response.json().catch(() => null);
        if (savedData && savedData.id) {
          if (updatedThreshold.type === 0) setTempThreshold(savedData);
          if (updatedThreshold.type === 1) setHumThreshold(savedData);
        }

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
            <CustomButton onClick={() => setShowLoginPopup(true)}>
              Jetzt anmelden
            </CustomButton>
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
      <div className="settings-header">
        <h2 className="page-title">Einstellungen</h2>
        <button onClick={logout} className="logout-btn">
          <FontAwesomeIcon icon={faUnlock} /> Logout
        </button>
      </div>
      
      <div className="dashboard-content">
        {isLoading ? (
          <div className="loading-state">
            <FontAwesomeIcon icon={faSpinner} spin /> Lade Einstellungen...
          </div>
        ) : (
          <div className="tacho-card settings-card" style={{ width: '100%' }}>
            
            <h3 className="settings-title">
              <FontAwesomeIcon icon={faClock} className="settings-title-icon" />
              System & App
            </h3>
            
            <div className="settings-list">
              <div className="settings-list-row" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <div className="settings-row-info">
                  <h4>Daten-Aktualisierung</h4>
                  <p>Wie oft sollen neue Werte vom Sensor geladen werden?</p>
                </div>
                
                <div className="settings-row-control">
                  <CustomDropdown 
                    options={INTERVAL_OPTIONS.map(opt => ({ id: opt.value, label: opt.label }))}
                    value={refreshInterval}
                    onChange={(newVal) => setRefreshInterval(Number(newVal))}
                  />
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--navy-100)', margin: '2rem 0', width: '100%' }} />

            <h3 className="settings-title">
              <FontAwesomeIcon icon={faBell} className="settings-title-icon" />
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
                      value={tempThreshold.minValue}
                      onChange={(e) => setTempThreshold((prev) => ({ ...prev, minValue: Number(e.target.value) }))}
                      onKeyDown={blockInvalidChars}
                      onBlur={() => handleSave(tempThreshold)}
                      className="threshold-input"
                    />
                  </div>
                  <div className="input-wrapper">
                    <span className="input-prefix">Max</span>
                    <input
                      type="number"
                      value={tempThreshold.maxValue}
                      onChange={(e) => setTempThreshold((prev) => ({ ...prev, maxValue: Number(e.target.value) }))}
                      onKeyDown={blockInvalidChars}
                      onBlur={() => handleSave(tempThreshold)}
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
                      value={humThreshold.minValue}
                      onChange={(e) => setHumThreshold((prev) => ({ ...prev, minValue: Number(e.target.value) }))}
                      onKeyDown={blockInvalidChars}
                      onBlur={() => handleSave(humThreshold)}
                      className="threshold-input"
                    />
                  </div>
                  <div className="input-wrapper">
                    <span className="input-prefix">Max</span>
                    <input
                      type="number"
                      value={humThreshold.maxValue}
                      onChange={(e) => setHumThreshold((prev) => ({ ...prev, maxValue: Number(e.target.value) }))}
                      onKeyDown={blockInvalidChars}
                      onBlur={() => handleSave(humThreshold)}
                      className="threshold-input"
                    />
                  </div>
                </div>
              </div>

              {message && <span className="save-message">{message}</span>}
              {error && <span className="error-message">{error}</span>}
              {isSaving && <span className="loading-message">Speichere im Backend...</span>}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--navy-100)', margin: '2.5rem 0 2rem 0', width: '100%' }} />

            <RegisterUser />

          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;