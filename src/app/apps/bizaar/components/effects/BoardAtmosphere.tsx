'use client'

// Atmospheric particles and ambient effects for the battlefield.
// CSS-only particle system — lightweight, no canvas, GPU-accelerated.

const PARTICLE_COUNT = 24

interface Particle {
  id: number
  left: string
  delay: string
  duration: string
  size: string
  opacity: number
  type: 'dust' | 'ember' | 'spark'
}

function generateParticles(): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const type = i < 14 ? 'dust' : i < 20 ? 'ember' : 'spark'
    particles.push({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 12}s`,
      duration: `${8 + Math.random() * 10}s`,
      size: type === 'spark' ? '1px' : type === 'ember' ? `${1.5 + Math.random()}px` : `${1 + Math.random() * 1.5}px`,
      opacity: type === 'spark' ? 0.7 + Math.random() * 0.3 : type === 'ember' ? 0.3 + Math.random() * 0.3 : 0.15 + Math.random() * 0.2,
      type,
    })
  }
  return particles
}

// Pre-generate so particles are stable across renders
const PARTICLES = generateParticles()

export default function BoardAtmosphere() {
  return (
    <div className="bzr-atmosphere" aria-hidden="true">
      {/* Vignette overlay — dark edges */}
      <div className="bzr-vignette" />

      {/* Floating particles */}
      <div className="bzr-particles">
        {PARTICLES.map(p => (
          <div
            key={p.id}
            className={`bzr-particle bzr-particle--${p.type}`}
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
            }}
          />
        ))}
      </div>

      {/* Lantern glow — warm ambient light */}
      <div className="bzr-lantern-glow" />
    </div>
  )
}
