"use client"

import { useState, useCallback, useReducer, useEffect } from "react"
import Link from "next/link"

// ── Constants ──────────────────────────────────────────────────────────────────
const CYCLE_MINUTES = 90
const DEFAULT_FALL_ASLEEP = 14 // minutes

// ── Dark palette (you're in bed) ───────────────────────────────────────────────
const C = {
  bg: "#0F0F12",
  surface: "#1A1A21",
  surfaceHover: "#22222B",
  border: "#2A2A35",
  text: "#E4E4E7",
  textMid: "#8B8B96",
  textDim: "#52525B",
  accent: "#818CF8",
  accentBg: "#1E1B4B",
  green: "#4ADE80",
  greenBg: "#052E16",
  yellow: "#FACC15",
  yellowBg: "#422006",
  orange: "#FB923C",
  orangeBg: "#431407",
  red: "#F87171",
  redBg: "#450A0A",
}

interface CycleOption {
  time: Date
  cycles: number
  hours: number
  minutes: number
  verdict: string
  verdictColor: string
  verdictBg: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function formatTime12(date: Date): string {
  const h = date.getHours()
  const m = String(date.getMinutes()).padStart(2, "0")
  const ampm = h >= 12 ? "pm" : "am"
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${m}${ampm}`
}

function getVerdict(cycles: number): { verdict: string; color: string; bg: string } {
  if (cycles >= 6) return { verdict: "Ideal", color: C.green, bg: C.greenBg }
  if (cycles === 5) return { verdict: "Good", color: C.green, bg: C.greenBg }
  if (cycles === 4) return { verdict: "Fine", color: C.yellow, bg: C.yellowBg }
  if (cycles === 3) return { verdict: "Survivable", color: C.orange, bg: C.orangeBg }
  if (cycles === 2) return { verdict: "Reckless", color: C.red, bg: C.redBg }
  return { verdict: "Nap", color: C.red, bg: C.redBg }
}

function getSubtext(cycles: number): string {
  if (cycles >= 6) return "You'll wake up feeling human."
  if (cycles === 5) return "Not perfect, but you'll function."
  if (cycles === 4) return "Coffee will be non-negotiable."
  if (cycles === 3) return "You'll manage. Barely."
  if (cycles === 2) return "This is a nap with ambition."
  return "Why bother lying down."
}

function computeBedtimes(wakeTime: Date, fallAsleep: number): CycleOption[] {
  const options: CycleOption[] = []
  for (let cycles = 6; cycles >= 2; cycles--) {
    const sleepMinutes = cycles * CYCLE_MINUTES
    const totalMinutes = sleepMinutes + fallAsleep
    const bedtime = new Date(wakeTime.getTime() - totalMinutes * 60000)
    const v = getVerdict(cycles)
    options.push({
      time: bedtime,
      cycles,
      hours: Math.floor(sleepMinutes / 60),
      minutes: sleepMinutes % 60,
      verdict: v.verdict,
      verdictColor: v.color,
      verdictBg: v.bg,
    })
  }
  return options
}

function computeAlarms(sleepTime: Date, fallAsleep: number): CycleOption[] {
  const options: CycleOption[] = []
  const actualSleep = new Date(sleepTime.getTime() + fallAsleep * 60000)
  for (let cycles = 3; cycles <= 7; cycles++) {
    const sleepMinutes = cycles * CYCLE_MINUTES
    const alarmTime = new Date(actualSleep.getTime() + sleepMinutes * 60000)
    const v = getVerdict(cycles)
    options.push({
      time: alarmTime,
      cycles,
      hours: Math.floor(sleepMinutes / 60),
      minutes: sleepMinutes % 60,
      verdict: v.verdict,
      verdictColor: v.color,
      verdictBg: v.bg,
    })
  }
  return options
}

// ── Settings persistence ───────────────────────────────────────────────────────
const STORAGE_KEY = "sleep_calc_v1"

interface Settings {
  fallAsleep: number
  use24h: boolean
  mounted: boolean
}

type SettingsAction =
  | { type: "hydrate"; fallAsleep: number; use24h: boolean }
  | { type: "set"; key: keyof Settings; value: Settings[keyof Settings] }

function settingsReducer(state: Settings, action: SettingsAction): Settings {
  switch (action.type) {
    case "hydrate":
      return { ...state, fallAsleep: action.fallAsleep, use24h: action.use24h, mounted: true }
    case "set":
      return { ...state, [action.key]: action.value }
    default:
      return state
  }
}

// ── Main Component ─────────────────────────────────────────────────────────────
type Mode = "wake" | "sleep"

export default function SleepCalc() {
  const [settings, dispatch] = useReducer(settingsReducer, {
    fallAsleep: DEFAULT_FALL_ASLEEP,
    use24h: true,
    mounted: false,
  })
  const { fallAsleep, use24h, mounted } = settings

  const [mode, setMode] = useState<Mode>("wake")
  const [wakeInput, setWakeInput] = useState("07:00")
  const [sleepInput, setSleepInput] = useState("")
  const [useNow, setUseNow] = useState(true)
  const [results, setResults] = useState<CycleOption[] | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  // Hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        dispatch({
          type: "hydrate",
          fallAsleep: saved.fallAsleep ?? DEFAULT_FALL_ASLEEP,
          use24h: saved.use24h ?? true,
        })
      } else {
        dispatch({ type: "hydrate", fallAsleep: DEFAULT_FALL_ASLEEP, use24h: true })
      }
    } catch {
      dispatch({ type: "hydrate", fallAsleep: DEFAULT_FALL_ASLEEP, use24h: true })
    }
  }, [])

  // Persist
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ fallAsleep, use24h }))
    } catch { /* ignore */ }
  }, [fallAsleep, use24h, mounted])

  const fmt = useCallback(
    (d: Date) => (use24h ? formatTime(d) : formatTime12(d)),
    [use24h],
  )

  const calculate = useCallback(() => {
    if (mode === "wake") {
      const [h, m] = wakeInput.split(":").map(Number)
      const wake = new Date()
      wake.setHours(h, m, 0, 0)
      // If the wake time has already passed today, assume tomorrow
      if (wake.getTime() < Date.now()) {
        wake.setDate(wake.getDate() + 1)
      }
      setResults(computeBedtimes(wake, fallAsleep))
    } else {
      let sleepTime: Date
      if (useNow) {
        sleepTime = new Date()
      } else {
        const [h, m] = sleepInput.split(":").map(Number)
        sleepTime = new Date()
        sleepTime.setHours(h, m, 0, 0)
      }
      setResults(computeAlarms(sleepTime, fallAsleep))
    }
  }, [mode, wakeInput, sleepInput, useNow, fallAsleep])

  const reset = useCallback(() => {
    setResults(null)
  }, [])

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
    <div style={{ background: C.bg, color: C.text }} className="min-h-screen flex flex-col">
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

      <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-16">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <h1
              className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2"
              style={{ color: C.text }}
            >
              sleep calculator
            </h1>
            <p className="text-sm" style={{ color: C.textMid }}>
              Wake up between cycles, not during them.
            </p>
          </div>

          {!results ? (
            <>
              {/* Mode toggle */}
              <div
                className="flex rounded-lg p-1 mb-6"
                style={{ background: C.surface }}
              >
                <button
                  onClick={() => { setMode("wake"); setResults(null) }}
                  className="flex-1 py-2 text-sm rounded-md transition-colors cursor-pointer"
                  style={{
                    background: mode === "wake" ? C.accent : "transparent",
                    color: mode === "wake" ? "#fff" : C.textMid,
                  }}
                >
                  I need to wake at...
                </button>
                <button
                  onClick={() => { setMode("sleep"); setResults(null) }}
                  className="flex-1 py-2 text-sm rounded-md transition-colors cursor-pointer"
                  style={{
                    background: mode === "sleep" ? C.accent : "transparent",
                    color: mode === "sleep" ? "#fff" : C.textMid,
                  }}
                >
                  I&apos;m going to sleep...
                </button>
              </div>

              {/* Input */}
              {mode === "wake" ? (
                <div className="mb-6">
                  <label
                    className="block text-[10px] sm:text-xs uppercase tracking-widest mb-2"
                    style={{ color: C.textDim }}
                  >
                    Wake-up time
                  </label>
                  <input
                    type="time"
                    value={wakeInput}
                    onChange={(e) => setWakeInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-lg text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    style={{
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      color: C.text,
                      colorScheme: "dark",
                    }}
                  />
                </div>
              ) : (
                <div className="mb-6">
                  <label
                    className="block text-[10px] sm:text-xs uppercase tracking-widest mb-2"
                    style={{ color: C.textDim }}
                  >
                    Going to sleep
                  </label>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setUseNow(true)}
                      className="flex-1 py-2.5 text-sm rounded-lg transition-colors cursor-pointer"
                      style={{
                        background: useNow ? C.accent : C.surface,
                        color: useNow ? "#fff" : C.textMid,
                        border: `1px solid ${useNow ? C.accent : C.border}`,
                      }}
                    >
                      Right now
                    </button>
                    <button
                      onClick={() => setUseNow(false)}
                      className="flex-1 py-2.5 text-sm rounded-lg transition-colors cursor-pointer"
                      style={{
                        background: !useNow ? C.accent : C.surface,
                        color: !useNow ? "#fff" : C.textMid,
                        border: `1px solid ${!useNow ? C.accent : C.border}`,
                      }}
                    >
                      At a specific time
                    </button>
                  </div>
                  {!useNow && (
                    <input
                      type="time"
                      value={sleepInput}
                      onChange={(e) => setSleepInput(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg text-lg text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      style={{
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        color: C.text,
                        colorScheme: "dark",
                      }}
                    />
                  )}
                </div>
              )}

              {/* How it works */}
              <div
                className="rounded-lg p-4 mb-6"
                style={{ background: C.surface, border: `1px solid ${C.border}` }}
              >
                <p className="text-xs leading-relaxed" style={{ color: C.textMid }}>
                  Sleep happens in ~90-minute cycles. Waking up between cycles
                  (not during one) is why you sometimes feel great after 6 hours
                  but terrible after 8. This calculates the times that land
                  between cycles.
                </p>
              </div>

              {/* Calculate button */}
              <button
                onClick={calculate}
                disabled={mode === "sleep" && !useNow && !sleepInput}
                className="w-full py-3.5 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: C.accent, color: "#fff" }}
              >
                Calculate
              </button>

              {/* Settings toggle */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-full text-center mt-4 text-xs transition-colors cursor-pointer"
                style={{ color: C.textDim }}
              >
                {showSettings ? "Hide" : "Show"} settings
              </button>

              {showSettings && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label
                      className="block text-[10px] uppercase tracking-widest mb-1"
                      style={{ color: C.textDim }}
                    >
                      Time to fall asleep: {fallAsleep} min
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={30}
                      value={fallAsleep}
                      onChange={(e) =>
                        dispatch({ type: "set", key: "fallAsleep", value: parseInt(e.target.value) })
                      }
                      className="w-full accent-indigo-400"
                    />
                    <div className="flex justify-between text-[10px]" style={{ color: C.textDim }}>
                      <span>5 min</span>
                      <span>30 min</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: C.textMid }}>
                      24-hour format
                    </span>
                    <button
                      onClick={() => dispatch({ type: "set", key: "use24h", value: !use24h })}
                      className="w-10 h-6 rounded-full transition-colors cursor-pointer relative"
                      style={{ background: use24h ? C.accent : C.border }}
                    >
                      <div
                        className="w-4 h-4 rounded-full bg-white absolute top-1 transition-all"
                        style={{ left: use24h ? "calc(100% - 20px)" : "4px" }}
                      />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Results */}
              <div className="mb-4">
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: C.textDim }}>
                  {mode === "wake" ? "Go to sleep at" : "Set your alarm for"}
                </p>
                <p className="text-xs" style={{ color: C.textMid }}>
                  {mode === "wake"
                    ? `To wake up at ${fmt((() => { const [h,m] = wakeInput.split(":").map(Number); const d = new Date(); d.setHours(h,m,0,0); return d })())}`
                    : `Going to sleep ${useNow ? "now" : `at ${fmt((() => { const [h,m] = sleepInput.split(":").map(Number); const d = new Date(); d.setHours(h,m,0,0); return d })())}`}`}
                  {" "}· {fallAsleep}min to fall asleep
                </p>
              </div>

              <div className="space-y-2 mb-6">
                {results.map((opt) => (
                  <div
                    key={opt.cycles}
                    className="rounded-lg p-4 transition-colors"
                    style={{ background: C.surface, border: `1px solid ${C.border}` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-2xl font-semibold tabular-nums"
                        style={{ color: C.text }}
                      >
                        {fmt(opt.time)}
                      </span>
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ background: opt.verdictBg, color: opt.verdictColor }}
                      >
                        {opt.verdict}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: C.textMid }}>
                      <span>
                        {opt.hours}h{opt.minutes > 0 ? ` ${opt.minutes}m` : ""} sleep
                      </span>
                      <span style={{ color: C.textDim }}>·</span>
                      <span>{opt.cycles} cycles</span>
                    </div>
                    <p className="text-xs mt-1.5 italic" style={{ color: C.textDim }}>
                      {getSubtext(opt.cycles)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <button
                onClick={reset}
                className="w-full py-3.5 rounded-lg text-sm font-medium transition-colors cursor-pointer mb-3"
                style={{ background: C.accent, color: "#fff" }}
              >
                Calculate again
              </button>
              <a
                href="https://shop.randomorium.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 rounded-lg text-sm text-center transition-colors"
                style={{ border: `1px solid ${C.border}`, color: C.textMid }}
              >
                Can&apos;t sleep? Buy a hat instead →
              </a>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        className="px-4 sm:px-6 py-4 text-xs font-mono flex justify-between"
        style={{ borderTop: `1px solid ${C.border}`, color: C.textDim }}
      >
        <span>randomorium.ai</span>
        <span>sleep calculator</span>
      </footer>
    </div>
  )
}
