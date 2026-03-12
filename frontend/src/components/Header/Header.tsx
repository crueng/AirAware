import { useState } from 'react'
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import NotificationBell from '../NotificationBell/NotificationBell';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="top-header">
      <div className="header-left">
        <button className='menu-btn' aria-label='Menü umschalten' onClick={toggleMenu}>
          <FontAwesomeIcon icon={isMenuOpen ? faXmark : faBars} size="lg" />
        </button>
        <h1 className='name'>AirAware</h1>
      </div>

      {/* Navigation und Glocke sind jetzt beide im rechten Container! */}
      <div className="header-right">
        <nav className={`desktop-nav ${isMenuOpen ? 'mobile-open' : ''}`}>
          <ul>
            <li><NavLink to="/" end onClick={closeMenu}>Dashboard</NavLink></li>
            <li><NavLink to="/temperature" onClick={closeMenu}>Temperatur</NavLink></li>
            <li><NavLink to="/humidity" onClick={closeMenu}>Luftfeuchtigkeit</NavLink></li>
            <li><NavLink to="/history" onClick={closeMenu}>Historie</NavLink></li>
            <li><NavLink to="/settings" onClick={closeMenu}>Einstellungen</NavLink></li>
          </ul>
        </nav>
        
        <NotificationBell />
      </div>
    </header> 
  )
}

export default Header;