import { useState } from 'react';
import './Login.css';
import { useAuth } from '../../context/AuthContext';
import CustomButton from '../CustomButton/CustomButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

interface LoginPopupProps {
  onClose: () => void;
  onSuccess: () => void;
}

const LoginPopup = ({ onClose, onSuccess }: LoginPopupProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mouseDownOnOverlay, setMouseDownOnOverlay] = useState(false);
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

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mouseDownOnOverlay && e.target === e.currentTarget) {
      onClose();
    }
    setMouseDownOnOverlay(false);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setMouseDownOnOverlay(true);
    } else {
      setMouseDownOnOverlay(false);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()} 
      >
        
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
            <CustomButton 
              type="button" 
              className="cancel-button" 
              onClick={onClose}
            >
              Abbrechen
            </CustomButton>

            <CustomButton 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : "Anmelden"}
            </CustomButton>
          </div>
        </form>

      </div>
    </div>
  );
};

export default LoginPopup;