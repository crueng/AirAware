import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHouse, 
  faClockRotateLeft, 
  faGear, 
  faTemperatureHalf, 
  faDroplet 
} from '@fortawesome/free-solid-svg-icons';
import './Footer.css';

const Footer = () => {
  const navItems = [
    { to: "/", icon: faHouse, label: "Dashboard" },
    { to: "/temperature", icon: faTemperatureHalf, label: "Temperatur" },
    { to: "/humidity", icon: faDroplet, label: "Feuchtigkeit" },
    { to: "/history", icon: faClockRotateLeft, label: "Historie" },
    { to: "/settings", icon: faGear, label: "Einstellungen" },
  ];

  return (
    <footer className="tab-bar">
      <div className="tab-bar__container">
        <div className="footer-section">
          <h3 className="footer-heading">Übersicht</h3>
          <div className="footer-links">
            {navItems.map((item) => (
              <NavLink 
                key={item.to}
                to={item.to} 
                className={({ isActive }) => isActive ? "tab-item tab-item--active" : "tab-item"}
              >
                <div className="tab-item__icon-wrapper">
                  <FontAwesomeIcon icon={item.icon} />
                </div>
                <span className="tab-item__label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
        
        <div className="footer-section">
          <h3 className="footer-heading">Information</h3>
          <div className="footer-links">
            <NavLink 
              to="/impressum" 
              className={({ isActive }) => isActive ? "tab-item tab-item--active" : "tab-item"}
            >
              <span className="tab-item__label">Impressum</span>
            </NavLink>
          </div>
        </div>
      </div>
      <p className="footer-text">&copy; {new Date().getFullYear()} AirAware - EFI24A Projekt. Alle Rechte vorbehalten.</p>
    </footer>
  );
};

export default Footer;