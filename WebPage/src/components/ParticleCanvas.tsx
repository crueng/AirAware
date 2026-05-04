import { useEffect, useRef } from 'react'

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const mouse = { x: null as number | null, y: null as number | null }

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }
    resize()

    class Particle {
      x = 0; y = 0; size = 0; speedX = 0; speedY = 0; opacity = 0; color = ''
      constructor() { this.reset() }
      reset() {
        this.x = Math.random() * canvas!.width
        this.y = Math.random() * canvas!.height
        this.size = Math.random() * 3 + 1
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = -Math.random() * 0.8 - 0.2
        this.opacity = Math.random() * 0.4 + 0.05
        const colors = ['152, 193, 217', '224, 251, 252', '61, 90, 128', '238, 108, 77']
        this.color = colors[Math.floor(Math.random() * colors.length)]
      }
      update() {
        this.x += this.speedX
        this.y += this.speedY
        if (mouse.x !== null && mouse.y !== null) {
          const dx = this.x - mouse.x
          const dy = this.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            this.x += (dx / dist) * 1.5
            this.y += (dy / dist) * 1.5
          }
        }
        if (this.y < -10 || this.x < -10 || this.x > canvas!.width + 10) {
          this.reset()
          this.y = canvas!.height + 10
        }
      }
      draw() {
        ctx!.beginPath()
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${this.color}, ${this.opacity})`
        ctx!.fill()
      }
    }

    const particles = Array.from({ length: 80 }, () => new Particle())

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      particles.forEach((p) => { p.update(); p.draw() })
      animId = requestAnimationFrame(animate)
    }
    animate()

    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY }
    window.addEventListener('resize', resize)
    document.addEventListener('mousemove', onMove)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      document.removeEventListener('mousemove', onMove)
    }
  }, [])

  return <canvas id="particles" ref={canvasRef} />
}
