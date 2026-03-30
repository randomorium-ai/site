'use client'

import { useState, useEffect, useRef } from 'react'
import type { EmpireStatus } from '@/lib/bizaar/engine/types'
import { EMPIRE_DEFINITIONS } from '@/lib/bizaar/engine/empires'

interface EmpireActivationProps {
  empireStatuses: EmpireStatus[]
}

interface ActiveFlourish {
  empireName: string
  key: number
}

// Generate burst rays for the radial light effect
const RAYS = Array.from({ length: 12 }, (_, i) => ({
  angle: (360 / 12) * i + Math.random() * 10,
  width: 1.5 + Math.random() * 2,
  length: 60 + Math.random() * 40,
  delay: Math.random() * 0.15,
}))

// Pre-generate spark particles
const SPARKS = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: `${20 + Math.random() * 60}%`,
  delay: `${Math.random() * 0.6}s`,
  duration: `${0.6 + Math.random() * 0.5}s`,
}))

export default function EmpireActivation({ empireStatuses }: EmpireActivationProps) {
  const [flourish, setFlourish] = useState<ActiveFlourish | null>(null)
  const prevStatusRef = useRef<Map<string, boolean>>(new Map())
  const keyRef = useRef(0)

  useEffect(() => {
    const prevMap = prevStatusRef.current

    for (const status of empireStatuses) {
      const wasActive = prevMap.get(`${status.empireId}-${status.owner}`) ?? false
      if (status.active && !wasActive) {
        const empire = EMPIRE_DEFINITIONS.find(e => e.id === status.empireId)
        if (empire) {
          keyRef.current++
          setFlourish({ empireName: empire.name, key: keyRef.current })
        }
      }
    }

    // Update prev map
    const newMap = new Map<string, boolean>()
    for (const status of empireStatuses) {
      newMap.set(`${status.empireId}-${status.owner}`, status.active)
    }
    prevStatusRef.current = newMap
  }, [empireStatuses])

  useEffect(() => {
    if (!flourish) return
    const timer = setTimeout(() => setFlourish(null), 1800)
    return () => clearTimeout(timer)
  }, [flourish])

  if (!flourish) return null

  return (
    <div key={flourish.key} className="bzr-empire-flourish">
      {/* Radial light burst */}
      <div className="bzr-empire-rays">
        {RAYS.map((ray, i) => (
          <div
            key={i}
            className="bzr-empire-ray"
            style={{
              transform: `rotate(${ray.angle}deg)`,
              width: `${ray.length}%`,
              height: `${ray.width}px`,
              animationDelay: `${ray.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Central glow */}
      <div className="bzr-empire-center-glow" />

      {/* Title */}
      <div className="bzr-empire-flourish-text">{flourish.empireName}</div>
      <div className="bzr-empire-flourish-sub">Empire Activated</div>

      {/* Particle shower */}
      <div className="bzr-empire-shower">
        {SPARKS.map(spark => (
          <div
            key={spark.id}
            className="bzr-empire-spark"
            style={{
              left: spark.left,
              animationDelay: spark.delay,
              animationDuration: spark.duration,
            }}
          />
        ))}
      </div>
    </div>
  )
}
