import { useEffect, useRef } from 'react'

export default function CTA() {
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
    <section className="cta-section" ref={sectionRef}>
      <h2 className="fade-in">Bereit für frische Luft? 🌿</h2>
      <p className="fade-in">
        Öffne das Dashboard und behalte dein Raumklima im Blick.
      </p>
      <a href="https://app.air-aware.de" className="btn-primary fade-in">
        Jetzt starten →
      </a>
    </section>
  )
}
