import { useState, useRef, useEffect } from 'react';
import { useSensorData } from '../../context/SensorContext';
import { Endpoints } from '../../apiConfig'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronDown,
  faCheck,
  faBell
} from '@fortawesome/free-solid-svg-icons';
import '../Pages.css';
import './Settings.css';

const OPTIONS = [
  { value: 5000, label: 'Alle 5 Sekunden' },
  { value: 10000, label: 'Alle 10 Sekunden' },
  { value: 30000, label: 'Alle 30 Sekunden' },
  { value: 60000, label: 'Jede Minute' }
];

const Settings = () => {
  const { refreshInterval, setRefreshInterval } = useSensorData();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [tempMin, setTempMin] = useState<number | string>(20);
  const [tempMax, setTempMax] = useState<number | string>(40);
  const [humMin, setHumMin] = useState<number | string>(20);
  const [humMax, setHumMax] = useState<number | string>(80);

  const lastSavedValues = useRef({
    tempMin: 20,
    tempMax: 40,
    humMin: 20,
    humMax: 80
  });

  const [isSaving, setIsSaving] = useState(false);
  const [thresholdMessage, setThresholdMessage] = useState('');
  const [intervalMessage, setIntervalMessage] = useState('');

  const [thresholdError, setThresholdError] = useState('');

  const selectedOption = OPTIONS.find(opt => opt.value === refreshInterval) || OPTIONS[0];

  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        const response = await fetch(Endpoints.Thresholds);
        if (response.ok) {
          const data = await response.json();
          
          let fetchedTempMin = 20, fetchedTempMax = 40, fetchedHumMin = 20, fetchedHumMax = 80;

          const tempThreshold = data.find((t: any) => t.type === 0);
          if (tempThreshold) {
            fetchedTempMin = tempThreshold.minValue;
            fetchedTempMax = tempThreshold.maxValue;
            setTempMin(fetchedTempMin);
            setTempMax(fetchedTempMax);
          }

          const humThreshold = data.find((t: any) => t.type === 1);
          if (humThreshold) {
            fetchedHumMin = humThreshold.minValue;
            fetchedHumMax = humThreshold.maxValue;
            setHumMin(fetchedHumMin);
            setHumMax(fetchedHumMax);
          }

          lastSavedValues.current = {
            tempMin: fetchedTempMin,
            tempMax: fetchedTempMax,
            humMin: fetchedHumMin,
            humMax: fetchedHumMax
          };
        }
      } catch (error) {
        console.error("Fehler beim Laden der Schwellenwerte:", error);
      }
    };

    fetchThresholds();
  }, []);

  const handleSaveThresholds = async () => {
    const cleanTempMin = tempMin === '' || isNaN(Number(tempMin)) ? 0 : Number(tempMin);
    const cleanTempMax = tempMax === '' || isNaN(Number(tempMax)) ? 0 : Number(tempMax);
    const cleanHumMin  = humMin === ''  || isNaN(Number(humMin))  ? 0 : Number(humMin);
    const cleanHumMax  = humMax === ''  || isNaN(Number(humMax))  ? 0 : Number(humMax);

    setTempMin(cleanTempMin);
    setTempMax(cleanTempMax);
    setHumMin(cleanHumMin);
    setHumMax(cleanHumMax);

    if (cleanTempMin >= cleanTempMax) {
      setThresholdError("Temperatur: Der 'Min'-Wert muss kleiner sein als der 'Max'-Wert.");
      setTimeout(() => setThresholdError(''), 5000);
      return;
    }

    if (cleanHumMin >= cleanHumMax) {
      setThresholdError("Luftfeuchtigkeit: Der 'Min'-Wert muss kleiner sein als der 'Max'-Wert.");
      setTimeout(() => setThresholdError(''), 5000);
      return; 
    }
    if (
      cleanTempMin === lastSavedValues.current.tempMin &&
      cleanTempMax === lastSavedValues.current.tempMax &&
      cleanHumMin === lastSavedValues.current.humMin &&
      cleanHumMax === lastSavedValues.current.humMax
    ) {
      return; 
    }

    setIsSaving(true); 
    setThresholdMessage('');
    setThresholdError('');
    
    try {
      const resTemp = await fetch(Endpoints.Thresholds, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 0, metricName: "TemperatureC", minValue: cleanTempMin, maxValue: cleanTempMax })
      });

      if (!resTemp.ok) {
        const errorText = await resTemp.text();
        throw new Error(`Temp abgelehnt: ${errorText}`);
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      const resHum = await fetch(Endpoints.Thresholds, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 1, metricName: "HumidityPercent", minValue: cleanHumMin, maxValue: cleanHumMax })
      });
      
      if (!resHum.ok) {
        const errorText = await resHum.text();
        throw new Error(`Hum abgelehnt: ${errorText}`);
      }

      lastSavedValues.current = {
        tempMin: cleanTempMin,
        tempMax: cleanTempMax,
        humMin: cleanHumMin,
        humMax: cleanHumMax
      };

      setThresholdMessage('Erfolgreich gespeichert!');
      setTimeout(() => setThresholdMessage(''), 3000); 

    } catch (error: any) {
      console.error("Backend hat Speichern blockiert:", error.message);
      
      const errorText = error.message.includes(':') 
        ? error.message.split(':')[1].trim() 
        : error.message;
        
      setThresholdError(`Ups, da lief was schief: ${errorText}`);
      setTimeout(() => setThresholdError(''), 5000);
    } finally {
      setIsSaving(false);
    } 
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value: number) => {
    if (value === refreshInterval) {
      setIsOpen(false);
      return;
    }

    setRefreshInterval(value);
    setIsOpen(false); 
    
    setIntervalMessage('Aktualisierungsrate gespeichert!');
    setTimeout(() => setIntervalMessage(''), 3000);
  };

  const blockInvalidChars = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  return (
    <div className="dashboard-container">
      <h2 className="page-title">Einstellungen</h2>
      
      <div className="tacho-card settings-card" style={{ marginBottom: '2rem' }}>
        <h3 className="settings-title">Daten-Aktualisierung</h3>
        <p className="settings-description">
          Lege fest, wie oft das Dashboard neue Sensorwerte vom Server abrufen soll.
        </p>
        
        <div className="settings-control">
          <label>Aktualisierungsrate:</label>
          <div className="custom-dropdown" ref={dropdownRef}>
            <div className={`dropdown-header ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
              <span>{selectedOption.label}</span>
              <FontAwesomeIcon icon={faChevronDown} className={`dropdown-arrow ${isOpen ? 'open' : ''}`} />
            </div>
            {isOpen && (
              <div className="dropdown-list">
                {OPTIONS.map((option) => (
                  <div key={option.value} className={`dropdown-item ${refreshInterval === option.value ? 'selected' : ''}`} onClick={() => handleSelect(option.value)}>
                    {option.label}
                    {refreshInterval === option.value && <FontAwesomeIcon icon={faCheck} className="check-icon" />}
                  </div>
                ))}
              </div>
            )}
          </div>
          {intervalMessage && <span className="save-message" style={{ display: 'block', marginTop: '0.5rem' }}>{intervalMessage}</span>}
        </div>
      </div>

      <div className="tacho-card settings-card">
        <h3 className="settings-title">
          <FontAwesomeIcon icon={faBell} style={{ marginRight: '8px', color: 'var(--primary-color)' }} />
          Zulässiger Normalbereich
        </h3>
        <p className="settings-description">
          Lege fest, ab welchen Werten das System einen Alarm auslösen soll.
        </p>
        
        <div className="thresholds-container">
          <div className="threshold-group">
            <label className="threshold-label">Temperatur (°C)</label>
            <div className="threshold-inputs">
              <div className="input-wrapper">
                <span className="input-prefix">Min</span>
                <input 
                  type="number" 
                  value={tempMin} 
                  onChange={e => setTempMin(e.target.value)} 
                  onKeyDown={blockInvalidChars}              
                  onBlur={handleSaveThresholds} 
                  disabled={isSaving}
                  className="threshold-input" 
                />
              </div>
              <div className="input-wrapper">
                <span className="input-prefix">Max</span>
                <input 
                  type="number" 
                  value={tempMax} 
                  onChange={e => setTempMax(e.target.value)} 
                  onKeyDown={blockInvalidChars}
                  onBlur={handleSaveThresholds} 
                  disabled={isSaving}
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
                  value={humMin} 
                  onChange={e => setHumMin(e.target.value)} 
                  onKeyDown={blockInvalidChars}
                  onBlur={handleSaveThresholds} 
                  disabled={isSaving}
                  className="threshold-input" 
                />
              </div>
              <div className="input-wrapper">
                <span className="input-prefix">Max</span>
                <input 
                  type="number" 
                  value={humMax} 
                  onChange={e => setHumMax(e.target.value)} 
                  onKeyDown={blockInvalidChars}
                  onBlur={handleSaveThresholds} 
                  disabled={isSaving}
                  className="threshold-input" 
                />
              </div>
            </div>
          </div>  
          {thresholdMessage && <span className="save-message">{thresholdMessage}</span>}
          {thresholdError && <span className="error-message">{thresholdError}</span>}
        </div>
      </div>

    </div>
  );
};

export default Settings;