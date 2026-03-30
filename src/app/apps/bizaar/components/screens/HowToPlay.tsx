'use client'

import { useState, useEffect } from 'react'

interface HowToPlayProps {
  onClose: () => void
}

const SLIDES = [
  {
    title: 'The Goal',
    body: 'Win 2 out of 3 rounds by having a higher total strength across the board than your opponent. Each round, you and the Serpent take turns playing cards until both pass.',
  },
  {
    title: 'Cards & Rows',
    body: 'Each card has a strength value and belongs to a row: Textiles, Spices, or Treasures. Cards can only be played in their matching row. Some cards have abilities that buff allies, debuff enemies, or disrupt empires.',
  },
  {
    title: 'Empires',
    body: 'Each row has an empire (3 matching cards). Play all 3 in the same row to activate a 1.5× score multiplier on that row. Your opponent can suppress your empire with disruption cards.',
  },
  {
    title: 'Passing & Strategy',
    body: 'You can pass your turn at any time to stop playing cards for the round. If you\'re ahead, passing early saves cards for later rounds. The loser of each round draws 1 bonus card.',
  },
  {
    title: 'Tips',
    body: 'Don\'t over-commit to round 1 — saving strong cards for later rounds often wins the match. Long-press any card in your hand (or tap board cards) to inspect its full details.',
  },
]

export default function HowToPlay({ onClose }: HowToPlayProps) {
  const [slide, setSlide] = useState(0)

  // Mark tutorial as seen
  useEffect(() => {
    localStorage.setItem('bizaar-tutorial-seen', '1')
  }, [])

  const isLast = slide === SLIDES.length - 1

  return (
    <div className="bzr-menu bzr-screen-enter">
      <div className="bzr-howto">
        {/* Progress dots */}
        <div className="bzr-howto-dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`bzr-howto-dot${i === slide ? ' bzr-howto-dot--active' : ''}`}
              onClick={() => setSlide(i)}
            />
          ))}
        </div>

        <h2 className="bzr-howto-title">{SLIDES[slide].title}</h2>
        <p className="bzr-howto-body">{SLIDES[slide].body}</p>

        <div className="bzr-howto-actions">
          {slide > 0 && (
            <button className="bzr-btn bzr-btn-secondary" onClick={() => setSlide(s => s - 1)}>
              Back
            </button>
          )}
          {!isLast ? (
            <button className="bzr-btn bzr-btn-primary" onClick={() => setSlide(s => s + 1)}>
              Next
            </button>
          ) : (
            <button className="bzr-btn bzr-btn-primary" onClick={onClose}>
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
