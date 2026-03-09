import { NavLink } from 'react-router-dom';
import './Header.css';

const Header = () => {
    return (
        <header className="top-header">
          <div className="header-left">
            <h1 className='name'>AirAware</h1>
          </div>

          <nav className="desktop-nav">
            <ul>
              <li>
                <NavLink to="/" end>Dashboard</NavLink>
              </li>
              <li>
                <NavLink to="/temperature" end>Temperatur</NavLink>
              </li>
              <li>
                <NavLink to="/humidity" end>Luftfeuchtigkeit</NavLink>
              </li>
              <li>
                <NavLink to="/history">Historie</NavLink>
              </li>
              <li>
                <NavLink to="/settings">Einstellungen</NavLink>
              </li>
            </ul>
          </nav>
        </header> 
    )
}

export default Header;