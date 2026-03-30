'use client'

import { useRef, useEffect } from 'react'

// Particle burst when a card is played on the board.
// Uses ref-based DOM manipulation to avoid setState-in-effect lint rule.

interface BurstParticle {
  x: number
  y: number
  size: number
  angle: number
  distance: number
  duration: number
}

interface CardPlayBurstProps {
  triggerKey: number // increment to trigger a burst
  color?: string
}

// Pre-generate burst particles
const BURST_PARTICLES: BurstParticle[] = Array.from({ length: 10 }, (_, i) => ({
  x: 50 + (Math.random() - 0.5) * 20,
  y: 50 + (Math.random() - 0.5) * 20,
  size: 2 + Math.random() * 3,
  angle: (360 / 10) * i + (Math.random() - 0.5) * 30,
  distance: 20 + Math.random() * 25,
  duration: 0.3 + Math.random() * 0.3,
}))

export default function CardPlayBurst({ triggerKey, color = 'rgba(45, 212, 191, 0.7)' }: CardPlayBurstProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (triggerKey <= 0 || !containerRef.current) return
    const el = containerRef.current
    // Toggle visibility via class
    el.classList.remove('bzr-card-burst--active')
    void el.offsetWidth
    el.classList.add('bzr-card-burst--active')
    const timer = setTimeout(() => el.classList.remove('bzr-card-burst--active'), 600)
    return () => clearTimeout(timer)
  }, [triggerKey])

  return (
    <div ref={containerRef} className="bzr-card-burst" aria-hidden="true">
      {BURST_PARTICLES.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180
        const tx = Math.cos(rad) * p.distance
        const ty = Math.sin(rad) * p.distance
        return (
          <div
            key={i}
            className="bzr-burst-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: color,
              boxShadow: `0 0 ${p.size}px ${color}`,
              '--burst-tx': `${tx}px`,
              '--burst-ty': `${ty}px`,
              animationDuration: `${p.duration}s`,
            } as React.CSSProperties}
          />
        )
      })}
    </div>
  )
}
