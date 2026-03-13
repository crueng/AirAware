import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faUnlock, faBell } from '@fortawesome/free-solid-svg-icons';
// import { Endpoints } from '../apiConfig'; 

const Settings = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [tempMin, setTempMin] = useState('10');
  const [tempMax, setTempMax] = useState('40');
  const [humMin, setHumMin] = useState('20');
  const [humMax, setHumMax] = useState('80');
  const [isSaving, setIsSaving] = useState(false);
  const [thresholdMessage, setThresholdMessage] = useState('');
  const [thresholdError, setThresholdError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin') {
      setIsLoggedIn(true);
      setShowLoginPopup(false);
    } else {
      alert("Falsches Passwort!");
    }
  };

  const blockInvalidChars = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleSaveThresholds = () => {
    console.log("Speichere...", { tempMin, tempMax, humMin, humMax });
  };

  if (!isLoggedIn) {
    return (
      <div className="dashboard-container">
        <h2 className="page-title">Einstellungen</h2>
        
        <div className="tacho-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <FontAwesomeIcon icon={faLock} size="3x" color="#9CA3AF" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--navy-900)', marginBottom: '0.5rem' }}>Einstellungen gesperrt</h3>
          <p style={{ color: '#6B7280', marginBottom: '2rem' }}>
            Bitte melde dich an, um die Alarm-Schwellenwerte und Systemkonfigurationen zu ändern.
          </p>
          <button 
            className="save-button" 
            onClick={() => setShowLoginPopup(true)}
            style={{ width: 'auto', padding: '0.8rem 2rem' }}
          >
            Jetzt anmelden
          </button>
        </div>

        {showLoginPopup && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 style={{ marginTop: 0, color: 'var(--navy-900)' }}>Admin Login</h3>
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <input 
                  type="text" 
                  placeholder="Benutzername" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="threshold-input" 
                  style={{ border: '1px solid #ccc', borderRadius: '8px' }}
                />
                <input 
                  type="password" 
                  placeholder="Passwort" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="threshold-input"
                  style={{ border: '1px solid #ccc', borderRadius: '8px' }}
                />
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="cancel-button" onClick={() => setShowLoginPopup(false)}>Abbrechen</button>
                  <button type="submit" className="save-button" style={{ flex: 1 }}>Einloggen</button>
                </div>
              </form>
            </div>
          </div>
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
          style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontWeight: 600 }}
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