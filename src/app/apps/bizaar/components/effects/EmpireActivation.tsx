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
    const timer = setTimeout(() => setFlourish(null), 1200)
    return () => clearTimeout(timer)
  }, [flourish])

  if (!flourish) return null

  return (
    <div key={flourish.key} className="bzr-empire-flourish">
      <div className="bzr-empire-flourish-text">{flourish.empireName}</div>
    </div>
  )
}
