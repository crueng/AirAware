import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faUnlock, faBell } from '@fortawesome/free-solid-svg-icons';
import LoginPopup from '../../components/LoginPopup/Login';
import './Settings.css'; 

const Settings = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [tempMin, setTempMin] = useState('10');
  const [tempMax, setTempMax] = useState('40');
  const [humMin, setHumMin] = useState('20');
  const [humMax, setHumMax] = useState('80');
  const [isSaving, setIsSaving] = useState(false);
  const [thresholdMessage, setThresholdMessage] = useState('');
  const [thresholdError, setThresholdError] = useState('');

  const blockInvalidChars = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleSaveThresholds = () => {
    console.log("Speichere...", { tempMin, tempMax, humMin, humMax });
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowLoginPopup(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="dashboard-container">
        <h2 className="page-title">Einstellungen</h2>
        
        <div className="locked-container">
          <FontAwesomeIcon icon={faLock} size="2x" className="locked-icon" />
          <div className="locked-text-wrapper">
            <h3 className="locked-title">Einstellungen gesperrt</h3>
            <p className="locked-description">
              Bitte melde dich an, um die Alarm-Schwellenwerte und Systemkonfigurationen zu ändern.
            </p>
          </div>
          <button className="save-button locked-btn" onClick={() => setShowLoginPopup(true)}>
            Jetzt anmelden
          </button>
        </div>
        {showLoginPopup && (
          <LoginPopup 
            onClose={() => setShowLoginPopup(false)} 
            onSuccess={handleLoginSuccess} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>Einstellungen</h2>
        <button 
          onClick={() => setIsLoggedIn(false)} 
          style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FontAwesomeIcon icon={faUnlock} /> Logout
        </button>
      </div>
      
       <div className="tacho-card settings-card">
        <h3 className="settings-title">
          <FontAwesomeIcon icon={faBell} style={{ marginRight: '8px', color: 'var(--primary-color)' }} />
          Zulässiger Normalbereich
        </h3>
        <p className="settings-description">
          Werte außerhalb dieses Bereichs lösen automatisch einen Alarm aus.
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