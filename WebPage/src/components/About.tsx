import { useEffect, useRef } from 'react'

export default function About() {
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
      el.querySelectorAll('.fade-in').forEach((child) => observer.observe(child))
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section className="about" id="about" ref={sectionRef}>
      <h2 className="section-title fade-in">Das Team</h2>
      <p className="section-subtitle fade-in">
        Entstanden als Schulprojekt der Klasse EFI24A, mit Leidenschaft
        entwickelt.
      </p>
      <div className="about-grid">
        <div className="about-image fade-in">
          <img src="/images/gruender.jpeg" alt="Team Air Aware" />
        </div>
        <div className="about-text fade-in">
          <h3>Von Schülern. Für die Zukunft.</h3>
          <p>
            Air Aware verbindet Embedded Systeme, Backend Engineering und
            modernes Frontend Design zu einem smarten IoT Ökosystem.
          </p>
          <p>
            Unser ESP32 Sensor erfasst Umgebungsdaten und sendet sie per MQTT an
            unser .NET Backend. Das React Dashboard visualisiert alles in
            Echtzeit.
          </p>
          <div className="team-names">
            <span className="team-tag">🎨 Finja · Frontend</span>
            <span className="team-tag">⚙️ Moritz · Backend</span>
            <span className="team-tag">🔌 Connor · Embedded</span>
          </div>
        </div>
      </div>
    </section>
  )
}
