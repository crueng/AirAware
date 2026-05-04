import { useEffect, useRef } from 'react'

function animateCounter(el: HTMLElement, target: number, suffix = '') {
  let current = 0
  const step = target / 60
  const timer = setInterval(() => {
    current += step
    if (current >= target) {
      current = target
      clearInterval(timer)
    }
    el.textContent = Math.floor(current) + suffix
  }, 16)
}

export default function Stats() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sensors = el.querySelector<HTMLElement>('#counter-sensors')
            const readings = el.querySelector<HTMLElement>('#counter-readings')
            const uptime = el.querySelector<HTMLElement>('#counter-uptime')
            if (sensors) animateCounter(sensors, 1)
            if (readings) animateCounter(readings, 1440)
            if (uptime) animateCounter(uptime, 99, '%')
            observer.disconnect()
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="stats" ref={sectionRef}>
      <div className="stats-grid">
        <div className="stat-item">
          <h4 id="counter-sensors">0</h4>
          <p>Sensor aktiv</p>
        </div>
        <div className="stat-item">
          <h4 id="counter-readings">0</h4>
          <p>Messungen/Tag</p>
        </div>
        <div className="stat-item">
          <h4 id="counter-uptime">0%</h4>
          <p>Uptime</p>
        </div>
      </div>
    </section>
  )
}
