'use client'

import Link from 'next/link'
import SerpentSigil from '../shared/SerpentSigil'

interface MainMenuProps {
  onStart: () => void
  onHowToPlay?: () => void
}

// Floating lantern particles for the menu
const LANTERN_PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  left: `${10 + Math.random() * 80}%`,
  delay: `${Math.random() * 8}s`,
  duration: `${10 + Math.random() * 8}s`,
  size: `${2 + Math.random() * 2}px`,
  opacity: 0.2 + Math.random() * 0.3,
}))

export default function MainMenu({ onStart, onHowToPlay }: MainMenuProps) {
  return (
    <div className="bzr-menu bzr-screen-enter">
      {/* Floating lantern particles */}
      <div className="bzr-menu-particles" aria-hidden="true">
        {LANTERN_PARTICLES.map(p => (
          <div
            key={p.id}
            className="bzr-menu-lantern"
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

      <Link
        href="/"
        className="bzr-menu-back"
      >
        &larr; randomorium.ai
      </Link>

      <div className="bzr-menu-sigil">
        <SerpentSigil size={72} />
      </div>

      <div className="bzr-menu-header">
        <h1 className="bzr-menu-title">Bizaar</h1>
        <p className="bzr-menu-subtitle">A card game of merchants &amp; empires</p>
      </div>

      <div className="bzr-menu-flavour">
        <p>Build your empire. Outwit the Serpent. Control the bazaar.</p>
      </div>

      <div className="bzr-menu-actions">
        <button className="bzr-btn bzr-btn-primary" onClick={onStart}>
          Start Match
        </button>
        <button className="bzr-btn bzr-btn-secondary" onClick={onHowToPlay}>
          How to Play
        </button>
      </div>
    </div>
  )
}
