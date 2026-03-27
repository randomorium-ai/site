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

  // Position score: where salary falls in the adjusted range
  // Below range floor → low score, above range ceiling → high score
  const range = marketHigh - marketLow
  let positionRatio: number

  if (range === 0) {
    positionRatio = salary >= marketHigh ? 1 : 0
  } else if (salary <= marketLow) {
    // Below market — scale from 5 to 50
    // The further below, the lower the score
    const deficit = marketLow - salary
    const deficitRatio = Math.min(deficit / range, 1)
    positionRatio = -deficitRatio
  } else if (salary >= marketHigh) {
    // Above market — already at top
    positionRatio = 1 + (salary - marketHigh) / range
  } else {
    // Within range
    positionRatio = (salary - marketLow) / range
  }

  // Map to 5–100 score
  let score: number
  if (positionRatio < 0) {
    // Below market: 5–45 (more below = stronger negotiation position)
    score = Math.round(45 + positionRatio * 40)
  } else if (positionRatio <= 1) {
    // Within range: 30–80
    score = Math.round(30 + positionRatio * 50)
  } else {
    // Above market: 80–100
    score = Math.round(80 + Math.min((positionRatio - 1) * 20, 20))
  }

  score = Math.max(5, Math.min(100, score))

  // Invert: low salary relative to market = HIGH negotiation score (more room to negotiate)
  score = 105 - score

  // Determine band
  const band = getBand(score)
  const bandLabel = getBandLabel(band)
  const bandColor = getBandColor(band)

  // Gap calculation
  const gapLow = Math.max(0, marketLow - salary)
  const gapHigh = Math.max(0, marketHigh - salary)

  // Chance and typical uplift
  const chance = getChance(band)
  const upliftLow = Math.round(salary * 0.05)
  const upliftHigh = Math.round(salary * 0.11)

  return {
    score,
    band,
    bandLabel,
    bandColor,
    marketLow,
    marketHigh,
    gapLow,
    gapHigh,
    chance,
    upliftLow,
    upliftHigh,
  }
}

function fallbackScore(salary: number): ScoreResult {
  return {
    score: 50,
    band: "possible",
    bandLabel: "Possible",
    bandColor: "#f59e0b",
    marketLow: Math.round(salary * 0.9),
    marketHigh: Math.round(salary * 1.3),
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
