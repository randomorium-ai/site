'use client'

interface SerpentSigilProps {
  size?: number
  className?: string
}

// Decorative serpent eye emblem — the Bizaar brand mark
export default function SerpentSigil({ size = 64, className = '' }: SerpentSigilProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={`bzr-sigil ${className}`}
      fill="none"
    >
      {/* Outer eye shape */}
      <path
        d="M4 32C4 32 16 12 32 12s28 20 28 20-12 20-28 20S4 32 4 32z"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
      />
      {/* Inner eye */}
      <path
        d="M10 32c0 0 8-14 22-14s22 14 22 14-8 14-22 14S10 32 10 32z"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.2"
      />
      {/* Pupil — diamond shape */}
      <path
        d="M32 22l6 10-6 10-6-10z"
        fill="currentColor"
        opacity="0.3"
      />
      {/* Center dot */}
      <circle cx="32" cy="32" r="2.5" fill="currentColor" opacity="0.6" />
      {/* Serpent curve left */}
      <path
        d="M14 32c4-8 10-12 18-12"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.15"
        strokeLinecap="round"
      />
      {/* Serpent curve right */}
      <path
        d="M50 32c-4 8-10 12-18 12"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.15"
        strokeLinecap="round"
      />
    </svg>
  )
}
