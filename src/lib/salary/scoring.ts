// ── Salary Negotiator — client-side score calculation ────────────────────────
import type { ExperienceLevel, ScoreResult, HatHook } from "./types"
import { SECTORS, LOCATIONS, SITUATIONS } from "./marketData"

export function calculateScore(
  salary: number,
  sector: string,
  location: string,
  experience: ExperienceLevel,
  situation: string,
): ScoreResult {
  // Look up sector range by experience level
  const sectorData = SECTORS[sector]
  if (!sectorData) {
    return fallbackScore(salary)
  }

  const [baseLow, baseHigh] = sectorData[experience]

  // Apply location multiplier
  const loc = LOCATIONS.find((l) => l.label === location)
  const locMultiplier = loc?.multiplier ?? 1.0

  // Apply situation multiplier
  const sit = SITUATIONS.find((s) => s.id === situation)
  const sitMultiplier = sit?.multiplier ?? 1.0

  const marketLow = Math.round(baseLow * locMultiplier * sitMultiplier)
  const marketHigh = Math.round(baseHigh * locMultiplier * sitMultiplier)
  const marketMid = Math.round((marketLow + marketHigh) / 2)

  // ── Negotiation score ──
  // Concept: the further below market your offer is, the stronger your
  // negotiation position (more room and justification to push up).
  //
  // Score mapping (continuous, no discontinuities):
  //   salary <= marketLow - range  → 100 (way below market, very strong case)
  //   salary = marketLow           → 80  (at market floor, strong case)
  //   salary = marketMid           → 55  (at midpoint, decent case)
  //   salary = marketHigh          → 30  (at ceiling, limited room)
  //   salary >= marketHigh + range → 5   (above market, little to negotiate)

  const range = marketHigh - marketLow
  let score: number

  if (range === 0) {
    score = salary >= marketHigh ? 20 : 80
  } else if (salary <= marketLow) {
    // Below market floor: 80–100 (capped at 100)
    const deficit = (marketLow - salary) / range
    score = Math.round(80 + Math.min(deficit, 1) * 20)
  } else if (salary <= marketHigh) {
    // Within market range: 30–80 (linear)
    const position = (salary - marketLow) / range
    score = Math.round(80 - position * 50)
  } else {
    // Above market ceiling: 5–30 (capped at 5)
    const surplus = (salary - marketHigh) / range
    score = Math.round(30 - Math.min(surplus, 1) * 25)
  }

  score = Math.max(5, Math.min(100, score))

  // Determine band
  const band = getBand(score)
  const bandLabel = getBandLabel(band)
  const bandColor = getBandColor(band)

  // Gap calculation
  const gapLow = Math.max(0, marketLow - salary)
  const gapHigh = Math.max(0, marketHigh - salary)

  // Chance and band-dependent uplift
  const chance = getChance(band)
  const [upliftPctLow, upliftPctHigh] = getUpliftRange(band)
  const upliftLow = Math.round(salary * upliftPctLow)
  const upliftHigh = Math.round(salary * upliftPctHigh)

  return {
    score,
    band,
    bandLabel,
    bandColor,
    marketLow,
    marketHigh,
    marketMid,
    gapLow,
    gapHigh,
    chance,
    upliftLow,
    upliftHigh,
  }
}

function fallbackScore(salary: number): ScoreResult {
  const marketLow = Math.round(salary * 0.9)
  const marketHigh = Math.round(salary * 1.3)
  return {
    score: 50,
    band: "possible",
    bandLabel: "Worth A Shot",
    bandColor: "#f59e0b",
    marketLow,
    marketHigh,
    marketMid: Math.round((marketLow + marketHigh) / 2),
    gapLow: 0,
    gapHigh: Math.round(salary * 0.3),
    chance: "MODERATE",
    upliftLow: Math.round(salary * 0.05),
    upliftHigh: Math.round(salary * 0.11),
  }
}

function getBand(score: number): "strong" | "good" | "possible" | "honest" {
  if (score >= 80) return "strong"
  if (score >= 60) return "good"
  if (score >= 40) return "possible"
  return "honest"
}

function getBandLabel(band: string): string {
  switch (band) {
    case "strong": return "Strong Position"
    case "good": return "Good Position"
    case "possible": return "Worth A Shot"
    case "honest": return "Honest Assessment"
    default: return "Assessment"
  }
}

function getBandColor(band: string): string {
  switch (band) {
    case "strong": return "#22c55e"
    case "good": return "#3ABCBD"
    case "possible": return "#f59e0b"
    case "honest": return "#94a3b8"
    default: return "#94a3b8"
  }
}

function getChance(band: string): string {
  switch (band) {
    case "strong": return "HIGH"
    case "good": return "GOOD"
    case "possible": return "MODERATE"
    case "honest": return "LOW"
    default: return "MODERATE"
  }
}

function getUpliftRange(band: string): [number, number] {
  switch (band) {
    case "strong": return [0.08, 0.15]
    case "good": return [0.05, 0.11]
    case "possible": return [0.03, 0.07]
    case "honest": return [0.01, 0.04]
    default: return [0.05, 0.11]
  }
}

export function getHatHook(band: "strong" | "good" | "possible" | "honest"): HatHook {
  switch (band) {
    case "strong":
      return { hat: "Definitely Fine", line: "You know your number. You'll be fine." }
    case "good":
      return { hat: "Locally Sourced", line: "Good value, well placed." }
    case "possible":
      return { hat: "Yacht Poor", line: "It's not about the money. It's about the principle." }
    case "honest":
      return { hat: "Corn Dad", line: "Sometimes the best negotiation is knowing when to accept." }
  }
}
