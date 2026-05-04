import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="impressum">
      <div className="impressum-container">
        <div className="footer-bottom">
          <p>
            © 2026 Air Aware · Temperatur für Bewässerung. Optimal. Natürlich. 🌱
            {' · '}
            <Link to="/impressum" className="footer-link">
              Impressum
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
