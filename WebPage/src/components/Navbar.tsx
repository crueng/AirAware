import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={scrolled ? 'scrolled' : ''}>
      <Link to="/" className="logo">
        <img src="/images/logo.png" alt="Air Aware Logo" />
        <span>Air Aware</span>
      </Link>
      <div className="nav-links">
        {location.pathname === '/' ? (
          <>
            <a href="#features">Features</a>
            <a href="#about">Team</a>
            <Link to="/impressum">Impressum</Link>
          </>
        ) : (
          <>
            <Link to="/">Startseite</Link>
            <Link to="/#features">Features</Link>
            <Link to="/#about">Team</Link>
          </>
        )}
        <a href="https://app.air-aware.de" className="cta-btn">Zum Dashboard →</a>
      </div>
    </nav>
  )
}
