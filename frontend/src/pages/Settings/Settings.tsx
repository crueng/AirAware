import { useState, useRef, useEffect } from 'react';
import { useSensorData } from '../../context/SensorContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronDown,
  faCheck
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

  const selectedOption = OPTIONS.find(opt => opt.value === refreshInterval) || OPTIONS[0];

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
    setRefreshInterval(value);
    setIsOpen(false); 
  };

  return (
    <div className="dashboard-container">
      <h2 className="page-title">Einstellungen</h2>
      
      <div className="tacho-card settings-card">
        <h3 className="settings-title">Daten-Aktualisierung</h3>
        <p className="settings-description">
          Lege fest, wie oft das Dashboard neue Sensorwerte vom Server abrufen soll.
        </p>
        
        <div className="settings-control">
          <label>Aktualisierungsrate:</label>

          <div className="custom-dropdown" ref={dropdownRef}>
            
            <div 
              className={`dropdown-header ${isOpen ? 'open' : ''}`} 
              onClick={() => setIsOpen(!isOpen)}
            >
              <span>{selectedOption.label}</span>
              <FontAwesomeIcon 
                icon={faChevronDown} 
                className={`dropdown-arrow ${isOpen ? 'open' : ''}`} 
              />
            </div>

            {isOpen && (
              <div className="dropdown-list">
                {OPTIONS.map((option) => (
                  <div 
                    key={option.value}
                    className={`dropdown-item ${refreshInterval === option.value ? 'selected' : ''}`}
                    onClick={() => handleSelect(option.value)}
                  >
                    {option.label}
                    
                    {refreshInterval === option.value && (
                      <FontAwesomeIcon 
                        icon={faCheck} 
                        className="check-icon" 
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;