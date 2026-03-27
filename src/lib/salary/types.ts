// ── Salary Negotiator — shared types ────────────────────────────────────────

export interface SectorRange {
  entry: [number, number]
  mid: [number, number]
  senior: [number, number]
  lead: [number, number]
}

export interface LocationMultiplier {
  label: string
  multiplier: number
}

export interface SituationOption {
  id: string
  label: string
  subtitle: string
  icon: string
  multiplier: number
}

export type ExperienceLevel = "entry" | "mid" | "senior" | "lead"

export interface FormData {
  offerText: string
  salary: number
  sector: string
  jobTitle: string
  location: string
  experience: ExperienceLevel
  situation: string
  hasDeadline: boolean
  deadline: string
}

export interface ScoreResult {
  score: number
  band: "strong" | "good" | "possible" | "honest"
  bandLabel: string
  bandColor: string
  marketLow: number
  marketHigh: number
  marketMid: number
  gapLow: number
  gapHigh: number
  chance: string
  upliftLow: number
  upliftHigh: number
}

export interface HatHook {
  hat: string
  line: string
}

export interface PlaybookSection {
  id: string
  title: string
  content: string
  status: "skeleton" | "streaming" | "complete"
}
