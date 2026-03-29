'use client'

import Link from 'next/link'
import SerpentSigil from '../shared/SerpentSigil'

interface MainMenuProps {
  onStart: () => void
}

export default function MainMenu({ onStart }: MainMenuProps) {
  return (
    <div className="bzr-menu">
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
        <button className="bzr-btn bzr-btn-secondary" disabled>
          Browse Cards
        </button>
      </div>
    </div>
  )
}
