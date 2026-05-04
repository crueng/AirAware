const leafPath =
  'M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.71c.79.74 1.63 1.4 2.5 2 2.92 2 4.84 2.71 7.84 2.71 3.67 0 6-2.33 6-6 0-4.67-3-8-6-10zm-1 14c-2.5 0-4.17-.63-6.8-2.4-.52-.34-1-.72-1.47-1.1L13 7c1.67 1.67 4 4.67 4 9 0 2.33-1 6-1 6z'

const leaves = [
  { left: '10%', w: 30, dur: 18, delay: 0, fill: '#22C55E' },
  { left: '30%', w: 22, dur: 22, delay: 4, fill: '#98C1D9' },
  { left: '55%', w: 26, dur: 20, delay: 7, fill: '#22C55E' },
  { left: '75%', w: 20, dur: 25, delay: 2, fill: '#E0FBFC' },
  { left: '90%', w: 28, dur: 19, delay: 10, fill: '#22C55E' },
  { left: '45%', w: 18, dur: 24, delay: 13, fill: '#98C1D9' },
]

export default function FloatingLeaves() {
  return (
    <>
      {leaves.map((l, i) => (
        <div
          key={i}
          className="leaf"
          style={{
            left: l.left,
            width: l.w,
            height: l.w,
            animationDuration: `${l.dur}s`,
            animationDelay: `${l.delay}s`,
          }}
        >
          <svg viewBox="0 0 24 24" fill={l.fill}>
            <path d={leafPath} />
          </svg>
        </div>
      ))}
    </>
  )
}
