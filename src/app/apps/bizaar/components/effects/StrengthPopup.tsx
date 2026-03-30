'use client'

import { useState, useEffect, useRef } from 'react'

interface StrengthPopupProps {
  currentStrength: number
}

interface Popup {
  value: number
  key: number
}

export default function StrengthPopup({ currentStrength }: StrengthPopupProps) {
  const [popup, setPopup] = useState<Popup | null>(null)
  const prevStrRef = useRef(currentStrength)
  const keyRef = useRef(0)

  useEffect(() => {
    const prev = prevStrRef.current
    prevStrRef.current = currentStrength

    if (currentStrength !== prev && prev !== 0) {
      const diff = currentStrength - prev
      if (diff !== 0) {
        keyRef.current++
        setPopup({ value: diff, key: keyRef.current })
      }
    }
  }, [currentStrength])

  useEffect(() => {
    if (!popup) return
    const timer = setTimeout(() => setPopup(null), 800)
    return () => clearTimeout(timer)
  }, [popup])

  if (!popup) return null

  const isPositive = popup.value > 0

  return (
    <div
      key={popup.key}
      className={`bzr-str-popup ${isPositive ? 'bzr-str-popup--buff' : 'bzr-str-popup--debuff'}`}
    >
      {isPositive ? '+' : ''}{popup.value}
    </div>
  )
}
