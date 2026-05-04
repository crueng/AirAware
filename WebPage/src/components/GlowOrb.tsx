import { useEffect, useRef } from 'react'

export default function GlowOrb() {
  const orbRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (orbRef.current) {
        orbRef.current.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`
      }
    }
    document.addEventListener('mousemove', onMove)
    return () => document.removeEventListener('mousemove', onMove)
  }, [])

  return <div className="glow-orb" ref={orbRef} />
}
