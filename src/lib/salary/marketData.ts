// ── Salary Negotiator — UK market data ──────────────────────────────────────
import type { SectorRange, LocationMultiplier, SituationOption } from "./types"

// 14 sectors × 4 experience levels (entry / mid / senior / lead)
// Ranges are annual GBP salary bands
export const SECTORS: Record<string, SectorRange> = {
  "Technology": {
    entry: [25000, 35000],
    mid: [35000, 55000],
    senior: [55000, 80000],
    lead: [80000, 120000],
  },
  "Finance & Banking": {
    entry: [28000, 38000],
    mid: [38000, 60000],
    senior: [60000, 90000],
    lead: [90000, 150000],
  },
  "Legal": {
    entry: [25000, 35000],
    mid: [35000, 55000],
    senior: [55000, 85000],
    lead: [85000, 130000],
  },
  "Healthcare": {
    entry: [22000, 30000],
    mid: [30000, 45000],
    senior: [45000, 65000],
    lead: [65000, 95000],
  },
  "Education": {
    entry: [22000, 28000],
    mid: [28000, 40000],
    senior: [40000, 55000],
    lead: [55000, 75000],
  },
  "Engineering": {
    entry: [26000, 34000],
    mid: [34000, 50000],
    senior: [50000, 72000],
    lead: [72000, 100000],
  },
  "Marketing & Creative": {
    entry: [22000, 30000],
    mid: [30000, 45000],
    senior: [45000, 65000],
    lead: [65000, 90000],
  },
  "Sales": {
    entry: [20000, 28000],
    mid: [28000, 42000],
    senior: [42000, 60000],
    lead: [60000, 85000],
  },
  "Consulting": {
    entry: [28000, 38000],
    mid: [38000, 58000],
    senior: [58000, 85000],
    lead: [85000, 130000],
  },
  "HR & People": {
    entry: [22000, 30000],
    mid: [30000, 45000],
    senior: [45000, 62000],
    lead: [62000, 85000],
  },
  "Public Sector": {
    entry: [22000, 28000],
    mid: [28000, 38000],
    senior: [38000, 52000],
    lead: [52000, 72000],
  },
  "Construction & Property": {
    entry: [22000, 30000],
    mid: [30000, 45000],
    senior: [45000, 65000],
    lead: [65000, 90000],
  },
  "Operations & Logistics": {
    entry: [21000, 28000],
    mid: [28000, 42000],
    senior: [42000, 58000],
    lead: [58000, 82000],
  },
  "Other": {
    entry: [22000, 30000],
    mid: [30000, 45000],
    senior: [45000, 65000],
    lead: [65000, 90000],
  },
}

export const SECTOR_OPTIONS = Object.keys(SECTORS)

// 13 UK locations with salary multipliers (London = 1.0 baseline)
export const LOCATIONS: LocationMultiplier[] = [
  { label: "London", multiplier: 1.0 },
  { label: "South East (excl. London)", multiplier: 0.88 },
  { label: "South West", multiplier: 0.82 },
  { label: "East of England", multiplier: 0.85 },
  { label: "West Midlands", multiplier: 0.80 },
  { label: "East Midlands", multiplier: 0.78 },
  { label: "North West", multiplier: 0.82 },
  { label: "North East", multiplier: 0.76 },
  { label: "Yorkshire & Humber", multiplier: 0.78 },
  { label: "Scotland", multiplier: 0.80 },
  { label: "Wales", multiplier: 0.76 },
  { label: "Northern Ireland", multiplier: 0.74 },
  { label: "Fully remote (UK-based)", multiplier: 0.90 },
]

// 5 situations affecting negotiation leverage
export const SITUATIONS: SituationOption[] = [
  {
    id: "new-offer",
    label: "New job offer",
    subtitle: "They have made their move",
    icon: "\uD83D\uDCEC",
    multiplier: 1.0,
  },
  {
    id: "counter-offer",
    label: "Counter-offer in hand",
    subtitle: "Two buyers at my stall",
    icon: "\u2696\uFE0F",
    multiplier: 1.15,
  },
  {
    id: "promotion",
    label: "Internal promotion",
    subtitle: "A bigger title, a small number",
    icon: "\uD83D\uDCC8",
    multiplier: 0.9,
  },
  {
    id: "annual-review",
    label: "Annual review",
    subtitle: "Asking for what you are owed",
    icon: "\uD83D\uDCCB",
    multiplier: 0.85,
  },
  {
    id: "post-probation",
    label: "Post-probation",
    subtitle: "You have proved yourself",
    icon: "\uD83C\uDFE0",
    multiplier: 0.95,
  },
]

export const EXPERIENCE_LEVELS = [
  { id: "entry" as const, label: "0\u20132 yrs \u00b7 Entry" },
  { id: "mid" as const, label: "3\u20135 yrs \u00b7 Mid" },
  { id: "senior" as const, label: "6\u201310 yrs \u00b7 Senior" },
  { id: "lead" as const, label: "10+ yrs \u00b7 Lead" },
]
