import { useState } from 'react';
import './Login.css';
import { useAuth } from '../../context/AuthContext';

interface LoginPopupProps {
  onClose: () => void;
  onSuccess: () => void;
}

const LoginPopup = ({ onClose, onSuccess }: LoginPopupProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth(); 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const success = await login(username, password);
    
    setIsLoading(false);

    if (success) {
      onSuccess();
    } else {
      alert("Login fehlgeschlagen! Bitte überprüfe Benutzernamen und Passwort.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        
        <div className="popup-header">
          <h3 className="popup-title">Admin Login</h3>
        </div>

        <p className="popup-description">
          Bitte gib deine Zugangsdaten ein.
        </p>
        
        <form onSubmit={handleLogin} className="login-form">
          <input 
            type="text" 
            placeholder="Benutzername" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="pin-input" 
          />
          <input 
            type="password" 
            placeholder="Passwort" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pin-input"
          />
          <div className="popup-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" disabled={isLoading} className="save-button popup-submit-btn">
              {isLoading ? "Lädt..." : "Einloggen"}
           </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default LoginPopup;