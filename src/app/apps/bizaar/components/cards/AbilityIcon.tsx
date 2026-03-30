'use client'

import type { AbilityEffect } from '@/lib/bizaar/engine/types'

interface AbilityIconProps {
  effect: AbilityEffect
  size?: number
  className?: string
}

export default function AbilityIcon({ effect, size = 16, className = '' }: AbilityIconProps) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', className: `bzr-ability-icon ${className}` }

  switch (effect.type) {
    // Empire / adjacency buff — two arrows pointing inward
    case 'adjacency_buff':
      return (
        <svg {...props}>
          <title>Adjacent Buff: +{effect.value}</title>
          <path d="M4 12h6M14 12h6M10 8l-4 4 4 4M14 8l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )

    // Row buff — shield with up arrow
    case 'row_buff':
      return (
        <svg {...props}>
          <title>Row Buff: +{effect.value}</title>
          <path d="M12 3L4 7v5c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V7l-8-4z" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 9v6M9 12l3-3 3 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )

    // Self buff per ally — group of people
    case 'self_buff_per_ally':
      return (
        <svg {...props}>
          <title>Strength per Ally: +{effect.value}</title>
          <circle cx="8" cy="7" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="16" cy="7" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 19c0-3 2.5-5 5-5s5 2 5 5M11 19c0-3 2.5-5 5-5s5 2 5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )

    // Suppress row — skull / disruption
    case 'suppress_row':
      return (
        <svg {...props}>
          <title>Suppress Empire</title>
          <circle cx="12" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="9" cy="9" r="1.5" fill="currentColor" />
          <circle cx="15" cy="9" r="1.5" fill="currentColor" />
          <path d="M9 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M10 17l2 4 2-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )

    // Weaken strongest — dagger pointing down
    case 'weaken_strongest':
      return (
        <svg {...props}>
          <title>Weaken Strongest: -{effect.value}</title>
          <path d="M12 3v12M9 12l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 19h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M10 21h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )

    // Self buff if losing — rising phoenix / underdog
    case 'self_buff_if_losing':
      return (
        <svg {...props}>
          <title>Underdog: +{effect.value} when losing</title>
          <path d="M12 21V8M8 12l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 5l3 3M19 5l-3 3M12 3v2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )

    // Burst at threshold — spark / explosion
    case 'burst_at_threshold':
      return (
        <svg {...props}>
          <title>Burst: +{effect.value} at {effect.threshold}+ allies</title>
          <path d="M12 2l1.5 5.5L19 6l-3.5 4.5L21 12l-5.5 1.5L17 19l-4.5-3.5L11 21l-1.5-5.5L4 17l3.5-4.5L2 11l5.5-1.5L6 4l4.5 3.5z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )

    default:
      return null
  }
}

// Empire crown icon — shown on cards that are part of an empire set
export function EmpireCrownIcon({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`bzr-empire-crown ${className}`}>
      <title>Empire Card</title>
      <path d="M3 18h18v2H3zM3 17l3-8 4 4 2-6 2 6 4-4 3 8z" fill="currentColor" />
    </svg>
  )
}

// Disruption icon — shown on cards that disrupt empires
export function DisruptionIcon({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`bzr-disruption-icon ${className}`}>
      <title>Disruption</title>
      <path d="M12 2L3 7l9 5 9-5-9-5z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 17l9 5 9-5M3 12l9 5 9-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="5" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
