"use client"

import { useState, useEffect, useCallback, useRef, useReducer } from "react"
import Link from "next/link"

// ── Storage ────────────────────────────────────────────────────────────────────
const STORAGE_KEY = "meeting_price_v1"

interface SavedSettings {
  attendees: number
  hourlyRate: number
  currency: string
}

interface MeetingRecord {
  id: string
  date: string
  attendees: number
  hourlyRate: number
  currency: string
  durationSeconds: number
  totalCost: number
}

interface StoredData {
  settings: SavedSettings
  history: MeetingRecord[]
}

function loadData(): StoredData {
  if (typeof window === "undefined") {
    return { settings: { attendees: 4, hourlyRate: 40, currency: "£" }, history: [] }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { settings: { attendees: 4, hourlyRate: 40, currency: "£" }, history: [] }
}

function saveData(data: StoredData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

// ── Palette (matches site's zinc theme) ────────────────────────────────────────
const C = {
  bg: "#FAFAFA",
  surface: "#FFFFFF",
  border: "#E4E4E7",
  text: "#18181B",
  textMid: "#71717A",
  textDim: "#A1A1AA",
  accent: "#18181B",
  accentHover: "#27272A",
  red: "#DC2626",
  redBg: "#FEF2F2",
  green: "#16A34A",
  greenBg: "#F0FDF4",
  amber: "#D97706",
  amberBg: "#FFFBEB",
}

// ── Cost milestones — dry, practical, one hat joke ─────────────────────────────
const MILESTONES = [
  { cost: 5, message: "That's a coffee for everyone." },
  { cost: 15, message: "Now it's lunch." },
  { cost: 30, message: "A nice dinner, gone." },
  { cost: 50, message: "That's a weekly shop." },
  { cost: 75, message: "A tank of petrol." },
  { cost: 100, message: "A decent pair of trainers." },
  { cost: 150, message: "A short weekend away." },
  { cost: 200, message: "Should this have been an email?" },
  { cost: 300, message: "A flight to somewhere warm." },
  { cost: 500, message: "A month of someone's rent (in the north)." },
  { cost: 750, message: "A very nice bicycle." },
  { cost: 1000, message: "Seriously. This could have been an email." },
  { cost: 2000, message: "A month of someone's rent (in London)." },
  { cost: 5000, message: "A second-hand car." },
  { cost: 10000, message: "This meeting costs more than most people earn in a month." },
]

const CURRENCIES = ["£", "$", "€"] as const

// ── Rate presets ───────────────────────────────────────────────────────────────
const RATE_PRESETS = [
  { label: "Junior", rate: 20, desc: "~£40k/yr" },
  { label: "Mid", rate: 35, desc: "~£70k/yr" },
  { label: "Senior", rate: 55, desc: "~£110k/yr" },
  { label: "Lead", rate: 75, desc: "~£150k/yr" },
  { label: "Exec", rate: 120, desc: "~£240k/yr" },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`
  return `${s}s`
}

function formatCost(amount: number, currency: string): string {
  if (amount < 1) return `${currency}${amount.toFixed(2)}`
  if (amount < 100) return `${currency}${amount.toFixed(2)}`
  if (amount < 1000) return `${currency}${amount.toFixed(1)}`
  return `${currency}${Math.round(amount).toLocaleString()}`
}

function formatCostPrecise(amount: number, currency: string): string {
  return `${currency}${amount.toFixed(2)}`
}

// ── Main Component ─────────────────────────────────────────────────────────────
type ViewState = "setup" | "running" | "summary"

interface Config {
  attendees: number
  hourlyRate: number
  currency: string
  history: MeetingRecord[]
  mounted: boolean
}

type ConfigAction =
  | { type: "hydrate"; data: StoredData }
  | { type: "set"; key: keyof Config; value: Config[keyof Config] }
  | { type: "addRecord"; record: MeetingRecord }
  | { type: "clearHistory" }

function configReducer(state: Config, action: ConfigAction): Config {
  switch (action.type) {
    case "hydrate":
      return {
        ...state,
        attendees: action.data.settings.attendees,
        hourlyRate: action.data.settings.hourlyRate,
        currency: action.data.settings.currency,
        history: action.data.history,
        mounted: true,
      }
    case "set":
      return { ...state, [action.key]: action.value }
    case "addRecord":
      return { ...state, history: [action.record, ...state.history].slice(0, 20) }
    case "clearHistory":
      return { ...state, history: [] }
    default:
      return state
  }
}

const CONFIG_INIT: Config = {
  attendees: 4,
  hourlyRate: 40,
  currency: "£",
  history: [],
  mounted: false,
}

export default function MeetingPrice() {
  const [config, dispatch] = useReducer(configReducer, CONFIG_INIT)
  const { attendees, hourlyRate, currency, history, mounted } = config
  const [viewState, setViewState] = useState<ViewState>("setup")
  const [customRate, setCustomRate] = useState("")
  const [elapsed, setElapsed] = useState(0)
  const [showHistory, setShowHistory] = useState(false)
  const startTimeRef = useRef<number>(0)
  const rafRef = useRef<number>(0)

  // Hydrate from localStorage on mount
  useEffect(() => {
    dispatch({ type: "hydrate", data: loadData() })
  }, [])

  // Persist to localStorage when config changes
  useEffect(() => {
    if (!mounted) return
    saveData({ settings: { attendees, hourlyRate, currency }, history })
  }, [attendees, hourlyRate, currency, history, mounted])

  // Real-time timer using rAF for smooth updates
  useEffect(() => {
    if (viewState !== "running") return

    function tick() {
      const now = Date.now()
      const seconds = Math.floor((now - startTimeRef.current) / 1000)
      setElapsed(seconds)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [viewState])

  const costPerSecond = (attendees * hourlyRate) / 3600
  const currentCost = elapsed * costPerSecond
  const currentMilestone = MILESTONES.filter((m) => currentCost >= m.cost).pop()

  const setAttendees = useCallback((n: number) => dispatch({ type: "set", key: "attendees", value: n }), [])
  const setHourlyRate = useCallback((n: number) => dispatch({ type: "set", key: "hourlyRate", value: n }), [])
  const setCurrency = useCallback((c: string) => dispatch({ type: "set", key: "currency", value: c }), [])

  const startMeeting = useCallback(() => {
    startTimeRef.current = Date.now()
    setElapsed(0)
    setViewState("running")
  }, [])

  const endMeeting = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    setViewState("summary")

    const record: MeetingRecord = {
      id: Date.now().toString(36),
      date: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      attendees,
      hourlyRate,
      currency,
      durationSeconds: elapsed,
      totalCost: elapsed * costPerSecond,
    }
    dispatch({ type: "addRecord", record })
  }, [attendees, hourlyRate, currency, elapsed, costPerSecond])

  const resetMeeting = useCallback(() => {
    setViewState("setup")
    setElapsed(0)
  }, [])

  const clearHistory = useCallback(() => {
    dispatch({ type: "clearHistory" })
  }, [])

  // Don't render until client-side (localStorage hydration)
  if (!mounted) {
    return (
      <div
        style={{ background: C.bg, minHeight: "100vh" }}
        className="flex items-center justify-center"
      >
        <p style={{ color: C.textDim }} className="text-sm">
          Loading...
        </p>
      </div>
    )
  }

  return (
    <div style={{ background: C.bg }} className="min-h-screen flex flex-col">
      {/* Nav */}
      <header
        style={{ borderBottom: `1px solid ${C.border}` }}
        className="px-4 sm:px-6 py-3 flex items-center justify-between"
      >
        <Link
          href="/"
          className="text-xs font-mono hover:opacity-70 transition-opacity"
          style={{ color: C.textMid }}
        >
          ← randomorium.ai
        </Link>
        <a
          href="https://shop.randomorium.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-3 py-1.5 rounded-full transition-colors"
          style={{ background: C.accent, color: "#fff" }}
        >
          buy a hat →
        </a>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-16">
        {/* ── SETUP ──────────────────────────────────────────────── */}
        {viewState === "setup" && (
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <h1
                className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2"
                style={{ color: C.text }}
              >
                meeting price
              </h1>
              <p className="text-sm" style={{ color: C.textMid }}>
                Find out what this meeting is actually costing.
              </p>
            </div>

            {/* Attendees */}
            <div className="mb-6">
              <label
                className="block text-[10px] sm:text-xs uppercase tracking-widest mb-2"
                style={{ color: C.textDim }}
              >
                People in the meeting
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAttendees(Math.max(1, attendees - 1))}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-medium transition-colors cursor-pointer"
                  style={{
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: C.text,
                  }}
                >
                  −
                </button>
                <span
                  className="text-3xl font-semibold tabular-nums w-16 text-center"
                  style={{ color: C.text }}
                >
                  {attendees}
                </span>
                <button
                  onClick={() => setAttendees(Math.min(50, attendees + 1))}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-medium transition-colors cursor-pointer"
                  style={{
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: C.text,
                  }}
                >
                  +
                </button>
              </div>
              {/* Quick presets */}
              <div className="flex gap-2 mt-2">
                {[2, 4, 6, 10, 15].map((n) => (
                  <button
                    key={n}
                    onClick={() => setAttendees(n)}
                    className="text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                    style={{
                      background: attendees === n ? C.accent : C.surface,
                      color: attendees === n ? "#fff" : C.textMid,
                      border: `1px solid ${attendees === n ? C.accent : C.border}`,
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Hourly rate */}
            <div className="mb-6">
              <label
                className="block text-[10px] sm:text-xs uppercase tracking-widest mb-2"
                style={{ color: C.textDim }}
              >
                Average hourly rate (per person)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {RATE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setHourlyRate(p.rate)
                      setCustomRate("")
                    }}
                    className="text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                    style={{
                      background:
                        hourlyRate === p.rate && !customRate
                          ? C.accent
                          : C.surface,
                      color:
                        hourlyRate === p.rate && !customRate
                          ? "#fff"
                          : C.textMid,
                      border: `1px solid ${hourlyRate === p.rate && !customRate ? C.accent : C.border}`,
                    }}
                  >
                    {p.label}
                    <span className="opacity-60 ml-1">{p.desc}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: C.textDim }}>
                  or
                </span>
                <div className="relative flex-1">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                    style={{ color: C.textDim }}
                  >
                    {currency}
                  </span>
                  <input
                    type="number"
                    value={customRate}
                    onChange={(e) => {
                      setCustomRate(e.target.value)
                      const v = parseFloat(e.target.value)
                      if (v > 0) setHourlyRate(v)
                    }}
                    placeholder="Custom"
                    min="1"
                    className="w-full pl-7 pr-10 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    style={{
                      border: `1px solid ${C.border}`,
                      background: C.surface,
                      color: C.text,
                    }}
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                    style={{ color: C.textDim }}
                  >
                    /hr
                  </span>
                </div>
              </div>
            </div>

            {/* Currency toggle */}
            <div className="mb-8">
              <label
                className="block text-[10px] sm:text-xs uppercase tracking-widest mb-2"
                style={{ color: C.textDim }}
              >
                Currency
              </label>
              <div className="flex gap-2">
                {CURRENCIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className="text-sm px-4 py-1.5 rounded-md transition-colors cursor-pointer"
                    style={{
                      background: currency === c ? C.accent : C.surface,
                      color: currency === c ? "#fff" : C.textMid,
                      border: `1px solid ${currency === c ? C.accent : C.border}`,
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div
              className="rounded-lg p-4 mb-6 text-center"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}
            >
              <p className="text-xs mb-1" style={{ color: C.textDim }}>
                This meeting will cost roughly
              </p>
              <p
                className="text-lg font-semibold tabular-nums"
                style={{ color: C.text }}
              >
                {formatCost(attendees * hourlyRate, currency)}/hr
              </p>
              <p className="text-xs mt-1" style={{ color: C.textDim }}>
                {currency}
                {(costPerSecond * 60).toFixed(2)}/min · {attendees} people ×{" "}
                {currency}
                {hourlyRate}/hr
              </p>
            </div>

            {/* Start button */}
            <button
              onClick={startMeeting}
              className="w-full py-3.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={{ background: C.accent, color: "#fff" }}
            >
              Start meeting
            </button>

            {/* History toggle */}
            {history.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full text-center mt-4 text-xs transition-colors cursor-pointer"
                style={{ color: C.textDim }}
              >
                {showHistory ? "Hide" : "Show"} past meetings ({history.length})
              </button>
            )}

            {/* History list */}
            {showHistory && history.length > 0 && (
              <div className="mt-4">
                <div className="space-y-2">
                  {history.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-xs"
                      style={{
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <div>
                        <span style={{ color: C.text }}>{r.date}</span>
                        <span className="mx-1.5" style={{ color: C.textDim }}>
                          ·
                        </span>
                        <span style={{ color: C.textDim }}>
                          {r.attendees} people · {formatDuration(r.durationSeconds)}
                        </span>
                      </div>
                      <span
                        className="font-medium tabular-nums"
                        style={{ color: C.text }}
                      >
                        {formatCostPrecise(r.totalCost, r.currency)}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={clearHistory}
                  className="w-full text-center mt-3 text-xs cursor-pointer"
                  style={{ color: C.red }}
                >
                  Clear history
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── RUNNING ────────────────────────────────────────────── */}
        {viewState === "running" && (
          <div className="w-full max-w-sm text-center">
            {/* Timer */}
            <p className="text-xs font-mono mb-1" style={{ color: C.textDim }}>
              {formatDuration(elapsed)}
            </p>

            {/* Big cost */}
            <p
              className="text-5xl sm:text-6xl font-semibold tabular-nums tracking-tight mb-1"
              style={{ color: C.text }}
            >
              {formatCost(currentCost, currency)}
            </p>

            {/* Rate info */}
            <p className="text-xs mb-8" style={{ color: C.textDim }}>
              {attendees} people × {currency}{hourlyRate}/hr
            </p>

            {/* Milestone */}
            <div className="h-12 flex items-center justify-center mb-8">
              {currentMilestone && (
                <p
                  key={currentMilestone.cost}
                  className="text-sm italic milestone-fade"
                  style={{ color: C.textMid }}
                >
                  {currentMilestone.message}
                </p>
              )}
            </div>

            {/* Per-minute / per-person stats */}
            <div
              className="grid grid-cols-2 gap-3 mb-8"
            >
              <div
                className="rounded-lg p-3"
                style={{ background: C.surface, border: `1px solid ${C.border}` }}
              >
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: C.textDim }}>
                  Per minute
                </p>
                <p className="text-sm font-medium tabular-nums" style={{ color: C.text }}>
                  {formatCostPrecise(costPerSecond * 60, currency)}
                </p>
              </div>
              <div
                className="rounded-lg p-3"
                style={{ background: C.surface, border: `1px solid ${C.border}` }}
              >
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: C.textDim }}>
                  Per person
                </p>
                <p className="text-sm font-medium tabular-nums" style={{ color: C.text }}>
                  {formatCostPrecise(currentCost / attendees, currency)}
                </p>
              </div>
            </div>

            {/* End button */}
            <button
              onClick={endMeeting}
              className="w-full py-3.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={{ background: C.red, color: "#fff" }}
            >
              End meeting
            </button>
          </div>
        )}

        {/* ── SUMMARY ────────────────────────────────────────────── */}
        {viewState === "summary" && (
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: C.textDim }}>
                Meeting complete
              </p>
              <p
                className="text-5xl sm:text-6xl font-semibold tabular-nums tracking-tight mb-2"
                style={{ color: C.text }}
              >
                {formatCostPrecise(currentCost, currency)}
              </p>
              <p className="text-sm" style={{ color: C.textMid }}>
                {formatDuration(elapsed)} · {attendees} people
              </p>
            </div>

            {/* Breakdown */}
            <div
              className="rounded-lg p-4 mb-6 space-y-3"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}
            >
              <div className="flex justify-between text-sm">
                <span style={{ color: C.textMid }}>Per person</span>
                <span className="font-medium tabular-nums" style={{ color: C.text }}>
                  {formatCostPrecise(currentCost / attendees, currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: C.textMid }}>Per minute</span>
                <span className="font-medium tabular-nums" style={{ color: C.text }}>
                  {formatCostPrecise(costPerSecond * 60, currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: C.textMid }}>If this happened daily (monthly)</span>
                <span className="font-medium tabular-nums" style={{ color: C.text }}>
                  {formatCost(currentCost * 22, currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: C.textMid }}>If this happened weekly (yearly)</span>
                <span className="font-medium tabular-nums" style={{ color: C.text }}>
                  {formatCost(currentCost * 52, currency)}
                </span>
              </div>
            </div>

            {/* Milestone reached */}
            {currentMilestone && (
              <div
                className="rounded-lg p-4 mb-6 text-center"
                style={{ background: C.amberBg, border: `1px solid #FDE68A` }}
              >
                <p className="text-sm" style={{ color: C.amber }}>
                  {currentMilestone.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <button
              onClick={resetMeeting}
              className="w-full py-3.5 rounded-lg text-sm font-medium transition-colors cursor-pointer mb-3"
              style={{ background: C.accent, color: "#fff" }}
            >
              Start another meeting
            </button>

            <a
              href="https://shop.randomorium.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 rounded-lg text-sm text-center transition-colors"
              style={{
                border: `1px solid ${C.border}`,
                color: C.textMid,
              }}
            >
              Or buy a hat instead →
            </a>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="px-4 sm:px-6 py-4 text-xs font-mono flex justify-between"
        style={{ borderTop: `1px solid ${C.border}`, color: C.textDim }}
      >
        <span>randomorium.ai</span>
        <span>meeting price</span>
      </footer>
    </div>
  )
}
