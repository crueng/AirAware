import { Link } from 'react-router-dom'
import { useEffect } from 'react'

export default function ImpressumPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <section className="impressum-page">
        <div className="impressum-page-container">
          <h1 className="section-title">Impressum</h1>

          <div className="impressum-grid impressum-page-grid">
            <div className="impressum-block">
              <h4>Schulprojekt</h4>
              <p>
                <strong>AirAware</strong> ist im Rahmen eines Schulprojekts der
                Klasse EFI24A entstanden. Es handelt sich um einen Prototypen
                und keine kommerzielle Anwendung.
              </p>
            </div>
            <div className="impressum-block">
              <h4>Entwicklung</h4>
              <p>
                Finja (Frontend)
                <br />
                Moritz (Backend)
                <br />
                Connor (Embedded)
              </p>
            </div>
            <div className="impressum-block">
              <h4>Haftungsausschluss</h4>
              <p>
                Alle gemessenen Sensordaten sind rein informativ. Wir übernehmen
                keine Haftung für verbrannte oder vertrocknete Pflanzen. 😉
              </p>
            </div>
          </div>

          <div className="impressum-back">
            <Link to="/" className="btn-secondary">
              ← Zurück zur Startseite
            </Link>
          </div>
        </div>
      </section>

      <footer className="impressum">
        <div className="impressum-container">
          <div className="footer-bottom">
            <p>
              © 2026 Air Aware · Temperatur für Bewässerung. Optimal. Natürlich. 🌱
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
