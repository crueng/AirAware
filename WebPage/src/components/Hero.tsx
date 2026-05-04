export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <img src="/images/logo.png" alt="Air Aware" className="hero-logo" />
        <h1>Intelligente Klimaüberwachung</h1>
        <p>
          Temperatur & Luftfeuchtigkeit in Echtzeit, für die optimale
          Bewässerung deiner Pflanzen. Natürlich. Smart. Automatisiert.
        </p>
        <div className="hero-buttons">
          <a href="https://app.air-aware.de" className="btn-primary">
            🌱 Dashboard öffnen
          </a>
          <a href="#features" className="btn-secondary">
            Mehr erfahren
          </a>
        </div>
      </div>
      <div className="scroll-indicator">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
        </svg>
      </div>
    </section>
  )
}
