import { useEffect, useRef } from 'react'

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), index * 100)
          }
        })
      },
      { threshold: 0.1 }
    )

    const el = sectionRef.current
    if (el) {
      el.querySelectorAll('.fade-in, .feature-card').forEach((child) =>
        observer.observe(child)
      )
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section className="features" id="features" ref={sectionRef}>
      <h2 className="section-title fade-in">Was Air Aware kann</h2>
      <p className="section-subtitle fade-in">
        Ein ESP32 Sensor misst Temperatur & Luftfeuchtigkeit und sendet die
        Daten direkt in dein Dashboard.
      </p>
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon temp">🌡️</div>
          <h3>Temperatur in °C & °F</h3>
          <p>
            Hochpräzise Erfassung der Umgebungstemperatur in Celsius und
            Fahrenheit, in Echtzeit auf deinem Dashboard.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon humidity">💧</div>
          <h3>Luftfeuchtigkeit</h3>
          <p>
            Überwachung der relativen Luftfeuchtigkeit für optimale
            Pflanzenbedingungen. Historische Daten & Trendanalyse.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon alert">🔔</div>
          <h3>Smart Alerts</h3>
          <p>
            Konfigurierbare Schwellenwerte mit sofortiger Benachrichtigung.
            Verpasse nie wieder den perfekten Gießzeitpunkt.
          </p>
        </div>
      </div>
    </section>
  )
}
