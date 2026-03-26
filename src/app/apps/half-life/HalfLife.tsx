"use client"

import { useState, useEffect, useReducer, useCallback, useRef, useMemo } from "react"
import Link from "next/link"

// ── Palette (coffee-shop dark) ──────────────────────────────────────────────
const C = {
  bg: "#1A1612",
  surface: "#241F19",
  surfaceHover: "#2E2820",
  border: "#3D3428",
  text: "#F5E6D3",
  textMid: "#B8A48E",
  textDim: "#7A6B5A",
  accent: "#E8A838",
  accentBg: "#3D2E0E",
  accentDim: "#C48A20",
  green: "#4ADE80",
  greenBg: "#052E16",
  yellow: "#FACC15",
  yellowBg: "#422006",
  orange: "#FB923C",
  orangeBg: "#431407",
  red: "#F87171",
  redBg: "#450A0A",
}

// ── Caffeine science ────────────────────────────────────────────────────────
const HALF_LIFE_HOURS = 5.7
const SLEEP_SAFE_MG = 100
const FDA_DAILY_LIMIT = 400

interface Drink {
  id: string
  name: string
  mg: number
  icon: string
  time: number // unix ms
}

const DRINK_PRESETS = [
  { name: "Espresso", mg: 63, icon: "☕" },
  { name: "Double Espresso", mg: 126, icon: "☕☕" },
  { name: "Filter Coffee", mg: 96, icon: "🫗" },
  { name: "Instant", mg: 62, icon: "🥄" },
  { name: "Black Tea", mg: 47, icon: "🍵" },
  { name: "Green Tea", mg: 28, icon: "🍃" },
  { name: "Cola", mg: 32, icon: "🥤" },
  { name: "Energy Drink", mg: 80, icon: "⚡" },
  { name: "Double Energy", mg: 160, icon: "⚡⚡" },
  { name: "Matcha", mg: 70, icon: "🍵" },
  { name: "Decaf", mg: 7, icon: "😴" },
]

// ── State ───────────────────────────────────────────────────────────────────
interface State {
  drinks: Drink[]
  halfLife: number // customizable
  mounted: boolean
}

const STORAGE_KEY = "half_life_v1"

type Action =
  | { type: "hydrate"; drinks: Drink[]; halfLife: number }
  | { type: "add_drink"; drink: Drink }
  | { type: "remove_drink"; id: string }
  | { type: "set_half_life"; value: number }
  | { type: "clear_today" }

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...state, drinks: action.drinks, halfLife: action.halfLife, mounted: true }
    case "add_drink":
      return { ...state, drinks: [...state.drinks, action.drink] }
    case "remove_drink":
      return { ...state, drinks: state.drinks.filter((d) => d.id !== action.id) }
    case "set_half_life":
      return { ...state, halfLife: action.value }
    case "clear_today":
      return { ...state, drinks: [] }
    default:
      return state
  }
}

const INIT: State = { drinks: [], halfLife: HALF_LIFE_HOURS, mounted: false }

// ── Caffeine math ───────────────────────────────────────────────────────────
function caffeineRemaining(mg: number, elapsedHours: number, halfLife: number): number {
  if (elapsedHours < 0) return 0
  return mg * Math.pow(0.5, elapsedHours / halfLife)
}

function totalCaffeineAt(drinks: Drink[], atTime: number, halfLife: number): number {
  return drinks.reduce((sum, d) => {
    const elapsed = (atTime - d.time) / (1000 * 60 * 60)
    return sum + caffeineRemaining(d.mg, elapsed, halfLife)
  }, 0)
}

function findSleepSafeTime(drinks: Drink[], halfLife: number): Date | null {
  if (drinks.length === 0) return null
  const now = Date.now()
  // Check from now forward in 5-minute increments, up to 24h
  for (let mins = 0; mins <= 1440; mins += 5) {
    const t = now + mins * 60 * 1000
    if (totalCaffeineAt(drinks, t, halfLife) <= SLEEP_SAFE_MG) {
      return new Date(t)
    }
  }
  return null // still above threshold in 24h
}

// ── Status helpers ──────────────────────────────────────────────────────────
function getStatus(mg: number): { label: string; color: string; bg: string; desc: string } {
  if (mg < 50) return { label: "Calm", color: C.green, bg: C.greenBg, desc: "Practically decaf" }
  if (mg < 100) return { label: "Mellow", color: C.green, bg: C.greenBg, desc: "Winding down nicely" }
  if (mg < 200) return { label: "Alert", color: C.yellow, bg: C.yellowBg, desc: "Focused and functional" }
  if (mg < 300) return { label: "Wired", color: C.orange, bg: C.orangeBg, desc: "Feeling productive (or anxious)" }
  if (mg < 400) return { label: "Buzzing", color: C.orange, bg: C.orangeBg, desc: "Your hands might be shaking" }
  return { label: "Excessive", color: C.red, bg: C.redBg, desc: "The FDA would like a word" }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

function formatTimeShort(hour: number): string {
  const h = Math.floor(((hour % 24) + 24) % 24)
  return `${h.toString().padStart(2, "0")}:00`
}

// ── Chart component ─────────────────────────────────────────────────────────
function CaffeineChart({
  drinks,
  halfLife,
  now,
}: {
  drinks: Drink[]
  halfLife: number
  now: number
}) {
  const W = 600
  const H = 200
  const PAD_L = 45
  const PAD_R = 10
  const PAD_T = 15
  const PAD_B = 30

  const chartW = W - PAD_L - PAD_R
  const chartH = H - PAD_T - PAD_B

  // Time range: 6am today to 6am tomorrow
  const todayStart = new Date(now)
  todayStart.setHours(6, 0, 0, 0)
  if (todayStart.getTime() > now) todayStart.setDate(todayStart.getDate() - 1)
  const startMs = todayStart.getTime()
  const endMs = startMs + 24 * 60 * 60 * 1000

  // Calculate caffeine levels at 10-min intervals
  const points: { t: number; mg: number }[] = []
  let maxMg = 100 // minimum y-axis
  for (let t = startMs; t <= endMs; t += 10 * 60 * 1000) {
    const mg = totalCaffeineAt(drinks, t, halfLife)
    points.push({ t, mg })
    if (mg > maxMg) maxMg = mg
  }
  maxMg = Math.ceil(maxMg / 50) * 50 // round up to nearest 50

  // Coordinate mapping
  const x = (t: number) => PAD_L + ((t - startMs) / (endMs - startMs)) * chartW
  const y = (mg: number) => PAD_T + chartH - (mg / maxMg) * chartH

  // Build path
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.t).toFixed(1)} ${y(p.mg).toFixed(1)}`)
    .join(" ")

  // Area fill path
  const areaD = `${pathD} L ${x(endMs).toFixed(1)} ${y(0).toFixed(1)} L ${x(startMs).toFixed(1)} ${y(0).toFixed(1)} Z`

  // "Now" line
  const nowX = x(Math.max(startMs, Math.min(now, endMs)))
  const nowInRange = now >= startMs && now <= endMs

  // Sleep-safe threshold line
  const safeY = y(SLEEP_SAFE_MG)

  // Hour labels
  const hourLabels: { hour: number; xPos: number }[] = []
  for (let h = 0; h <= 24; h += 3) {
    const t = startMs + h * 60 * 60 * 1000
    const d = new Date(t)
    hourLabels.push({ hour: d.getHours(), xPos: x(t) })
  }

  // Y-axis labels
  const yLabels: number[] = []
  const yStep = maxMg <= 200 ? 50 : maxMg <= 500 ? 100 : 200
  for (let v = 0; v <= maxMg; v += yStep) {
    yLabels.push(v)
  }

  // Drink markers
  const drinkMarkers = drinks
    .filter((d) => d.time >= startMs && d.time <= endMs)
    .map((d) => ({
      id: d.id,
      xPos: x(d.time),
      mg: d.mg,
      name: d.name,
    }))

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto" }}
      role="img"
      aria-label="Caffeine level chart over 24 hours"
    >
      {/* Grid lines */}
      {yLabels.map((v) => (
        <g key={v}>
          <line
            x1={PAD_L}
            y1={y(v)}
            x2={W - PAD_R}
            y2={y(v)}
            stroke={C.border}
            strokeWidth={0.5}
            strokeDasharray={v === 0 ? "none" : "4 3"}
          />
          <text
            x={PAD_L - 6}
            y={y(v) + 4}
            textAnchor="end"
            fill={C.textDim}
            fontSize={10}
          >
            {v}
          </text>
        </g>
      ))}

      {/* Sleep-safe threshold */}
      {SLEEP_SAFE_MG <= maxMg && (
        <line
          x1={PAD_L}
          y1={safeY}
          x2={W - PAD_R}
          y2={safeY}
          stroke={C.green}
          strokeWidth={1}
          strokeDasharray="6 3"
          opacity={0.5}
        />
      )}

      {/* Area fill */}
      <path d={areaD} fill={C.accent} opacity={0.12} />

      {/* Line */}
      <path d={pathD} fill="none" stroke={C.accent} strokeWidth={2} />

      {/* "Now" vertical line */}
      {nowInRange && (
        <line
          x1={nowX}
          y1={PAD_T}
          x2={nowX}
          y2={PAD_T + chartH}
          stroke={C.text}
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.4}
        />
      )}

      {/* Drink markers */}
      {drinkMarkers.map((d) => (
        <g key={d.id}>
          <line
            x1={d.xPos}
            y1={PAD_T}
            x2={d.xPos}
            y2={PAD_T + chartH}
            stroke={C.accent}
            strokeWidth={0.5}
            opacity={0.3}
          />
          <circle
            cx={d.xPos}
            cy={PAD_T + 8}
            r={4}
            fill={C.accent}
            opacity={0.8}
          />
        </g>
      ))}

      {/* Hour labels */}
      {hourLabels.map(({ hour, xPos }) => (
        <text
          key={`h-${hour}-${xPos}`}
          x={xPos}
          y={H - 6}
          textAnchor="middle"
          fill={C.textDim}
          fontSize={10}
        >
          {formatTimeShort(hour)}
        </text>
      ))}

      {/* "Now" label */}
      {nowInRange && (
        <text
          x={nowX}
          y={H - 6}
          textAnchor="middle"
          fill={C.text}
          fontSize={9}
          fontWeight={600}
        >
          now
        </text>
      )}
    </svg>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export default function HalfLife() {
  const [state, dispatch] = useReducer(reducer, INIT)
  const { drinks, halfLife, mounted } = state
  const [now, setNow] = useState(Date.now)
  const [showSettings, setShowSettings] = useState(false)
  const [customMg, setCustomMg] = useState("")
  const [customName, setCustomName] = useState("")
  const [showCustom, setShowCustom] = useState(false)
  const tickRef = useRef<ReturnType<typeof setInterval>>(null)

  // Hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        // Filter out drinks older than 24h
        const cutoff = Date.now() - 24 * 60 * 60 * 1000
        const recentDrinks = (saved.drinks ?? []).filter((d: Drink) => d.time > cutoff)
        dispatch({
          type: "hydrate",
          drinks: recentDrinks,
          halfLife: saved.halfLife ?? HALF_LIFE_HOURS,
        })
      } else {
        dispatch({ type: "hydrate", drinks: [], halfLife: HALF_LIFE_HOURS })
      }
    } catch {
      dispatch({ type: "hydrate", drinks: [], halfLife: HALF_LIFE_HOURS })
    }
  }, [])

  // Persist
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ drinks, halfLife }))
    } catch { /* ignore */ }
  }, [drinks, halfLife, mounted])

  // Tick every 30s to update current levels
  useEffect(() => {
    tickRef.current = setInterval(() => setNow(Date.now()), 30000)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [])

  // ── Calculations ────────────────────────────────────────────────────────
  const currentMg = useMemo(
    () => totalCaffeineAt(drinks, now, halfLife),
    [drinks, now, halfLife]
  )
  const totalConsumed = useMemo(
    () => drinks.reduce((sum, d) => sum + d.mg, 0),
    [drinks]
  )
  const status = getStatus(currentMg)
  const sleepSafeTime = useMemo(
    () => findSleepSafeTime(drinks, halfLife),
    [drinks, halfLife]
  )

  // ── Handlers ──────────────────────────────────────────────────────────
  const addPreset = useCallback(
    (preset: (typeof DRINK_PRESETS)[number]) => {
      dispatch({
        type: "add_drink",
        drink: {
          id: uid(),
          name: preset.name,
          mg: preset.mg,
          icon: preset.icon,
          time: Date.now(),
        },
      })
      setNow(Date.now())
    },
    []
  )

  const addCustomDrink = useCallback(() => {
    const mg = parseFloat(customMg)
    if (isNaN(mg) || mg <= 0) return
    dispatch({
      type: "add_drink",
      drink: {
        id: uid(),
        name: customName.trim() || "Custom",
        mg,
        icon: "🧪",
        time: Date.now(),
      },
    })
    setCustomMg("")
    setCustomName("")
    setShowCustom(false)
    setNow(Date.now())
  }, [customMg, customName])

  // ── Loading ───────────────────────────────────────────────────────────
  if (!mounted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: C.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: C.textDim }}>Loading…</p>
      </div>
    )
  }

  // ── Styles ────────────────────────────────────────────────────────────
  const sectionStyle: React.CSSProperties = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: "20px",
    marginBottom: 16,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: C.textMid,
    marginBottom: 10,
    display: "block",
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px 20px" }}>
        <Link
          href="/"
          style={{ fontSize: 12, color: C.textDim, textDecoration: "none", display: "inline-block", marginBottom: 20 }}
        >
          ← randomorium
        </Link>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: C.text,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Half-Life
        </h1>
        <p style={{ fontSize: 15, color: C.textMid, margin: "6px 0 0" }}>
          Track your caffeine. Know when you&apos;ll crash.
        </p>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 20px 40px" }}>
        {/* Current level hero */}
        <div
          style={{
            ...sectionStyle,
            textAlign: "center",
            padding: "28px 20px",
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: status.color,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {Math.round(currentMg)}
            <span style={{ fontSize: 20, fontWeight: 400, color: C.textMid, marginLeft: 4 }}>
              mg
            </span>
          </div>
          <div
            style={{
              display: "inline-block",
              marginTop: 10,
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              background: status.bg,
              color: status.color,
            }}
          >
            {status.label}
          </div>
          <p style={{ fontSize: 13, color: C.textDim, marginTop: 8, marginBottom: 0 }}>
            {status.desc}
          </p>

          {/* Sleep-safe indicator */}
          {drinks.length > 0 && (
            <div
              style={{
                marginTop: 16,
                padding: "10px 16px",
                borderRadius: 10,
                background: currentMg <= SLEEP_SAFE_MG ? C.greenBg : C.surface,
                border: `1px solid ${currentMg <= SLEEP_SAFE_MG ? C.green + "30" : C.border}`,
              }}
            >
              {currentMg <= SLEEP_SAFE_MG ? (
                <p style={{ fontSize: 14, color: C.green, margin: 0 }}>
                  You&apos;re below {SLEEP_SAFE_MG}mg — safe to sleep now
                </p>
              ) : sleepSafeTime ? (
                <p style={{ fontSize: 14, color: C.textMid, margin: 0 }}>
                  Safe to sleep from{" "}
                  <span style={{ color: C.accent, fontWeight: 600 }}>
                    {formatTime(sleepSafeTime)}
                  </span>
                  <span style={{ color: C.textDim }}> (below {SLEEP_SAFE_MG}mg)</span>
                </p>
              ) : (
                <p style={{ fontSize: 14, color: C.red, margin: 0 }}>
                  Still above {SLEEP_SAFE_MG}mg for the next 24 hours. Impressive.
                </p>
              )}
            </div>
          )}

          {/* FDA warning */}
          {totalConsumed >= FDA_DAILY_LIMIT && (
            <div
              style={{
                marginTop: 10,
                padding: "8px 14px",
                borderRadius: 8,
                background: C.redBg,
                border: `1px solid ${C.red}30`,
              }}
            >
              <p style={{ fontSize: 12, color: C.red, margin: 0 }}>
                You&apos;ve consumed {Math.round(totalConsumed)}mg today. The FDA recommends no more than {FDA_DAILY_LIMIT}mg/day.
              </p>
            </div>
          )}
        </div>

        {/* Chart */}
        {drinks.length > 0 && (
          <div style={sectionStyle}>
            <span style={labelStyle}>Your caffeine curve</span>
            <CaffeineChart drinks={drinks} halfLife={halfLife} now={now} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
                fontSize: 11,
                color: C.textDim,
              }}
            >
              <span>Amber line = caffeine level</span>
              <span>Dashed green = sleep-safe ({SLEEP_SAFE_MG}mg)</span>
            </div>
          </div>
        )}

        {/* Add drink */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Add a drink</span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: 8,
            }}
          >
            {DRINK_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => addPreset(preset)}
                style={{
                  background: C.surfaceHover,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.accent
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border
                }}
              >
                <div style={{ fontSize: 14, marginBottom: 2 }}>{preset.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                  {preset.name}
                </div>
                <div style={{ fontSize: 11, color: C.textDim }}>{preset.mg}mg</div>
              </button>
            ))}

            {/* Custom button */}
            <button
              onClick={() => setShowCustom(!showCustom)}
              style={{
                background: showCustom ? C.accentBg : C.surfaceHover,
                border: `1px solid ${showCustom ? C.accent : C.border}`,
                borderRadius: 10,
                padding: "10px 12px",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
              }}
            >
              <div style={{ fontSize: 14, marginBottom: 2 }}>🧪</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Custom</div>
              <div style={{ fontSize: 11, color: C.textDim }}>Any amount</div>
            </button>
          </div>

          {/* Custom drink form */}
          {showCustom && (
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 12,
                alignItems: "center",
              }}
            >
              <input
                style={{
                  background: C.surfaceHover,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 14,
                  color: C.text,
                  outline: "none",
                  flex: 2,
                  fontFamily: "inherit",
                }}
                value={customName}
                placeholder="Name…"
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomDrink()}
              />
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  style={{
                    background: C.surfaceHover,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: "8px 12px 8px 12px",
                    fontSize: 14,
                    color: C.text,
                    outline: "none",
                    width: "100%",
                    fontFamily: "inherit",
                  }}
                  value={customMg}
                  placeholder="mg"
                  type="number"
                  min="1"
                  onChange={(e) => setCustomMg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomDrink()}
                />
              </div>
              <button
                onClick={addCustomDrink}
                style={{
                  background: C.accent,
                  color: "#000",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 14px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Today's log */}
        {drinks.length > 0 && (
          <div style={sectionStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <span style={labelStyle}>Today&apos;s log</span>
              <button
                onClick={() => dispatch({ type: "clear_today" })}
                style={{
                  background: "transparent",
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 11,
                  color: C.textDim,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Clear all
              </button>
            </div>
            {[...drinks].reverse().map((d) => {
              const elapsed = (now - d.time) / (1000 * 60 * 60)
              const remaining = caffeineRemaining(d.mg, elapsed, halfLife)
              return (
                <div
                  key={d.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{d.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                        {d.name}
                      </div>
                      <div style={{ fontSize: 12, color: C.textDim }}>
                        {formatTime(new Date(d.time))} · {d.mg}mg
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.accent }}>
                      {Math.round(remaining)}mg
                    </div>
                    <div style={{ fontSize: 11, color: C.textDim }}>remaining</div>
                  </div>
                </div>
              )
            })}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: 10,
                fontSize: 13,
                color: C.textMid,
              }}
            >
              <span>Total consumed</span>
              <span style={{ fontWeight: 700 }}>{Math.round(totalConsumed)}mg</span>
            </div>
          </div>
        )}

        {/* Settings */}
        <div style={sectionStyle}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              color: C.textMid,
              fontSize: 13,
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 11 }}>{showSettings ? "▼" : "▶"}</span>
            Settings
          </button>
          {showSettings && (
            <div style={{ marginTop: 14 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  color: C.textMid,
                  marginBottom: 8,
                }}
              >
                Caffeine half-life:{" "}
                <span style={{ color: C.accent, fontWeight: 600 }}>
                  {halfLife.toFixed(1)} hours
                </span>
              </label>
              <input
                type="range"
                min="3"
                max="9"
                step="0.1"
                value={halfLife}
                onChange={(e) =>
                  dispatch({
                    type: "set_half_life",
                    value: parseFloat(e.target.value),
                  })
                }
                style={{ width: "100%", accentColor: C.accent }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: C.textDim,
                  marginTop: 4,
                }}
              >
                <span>3h (fast metaboliser)</span>
                <span>9h (slow metaboliser)</span>
              </div>
              <p style={{ fontSize: 12, color: C.textDim, marginTop: 12 }}>
                Average is 5.7 hours. Affected by age, weight, genetics, liver function, and medications.
                Smokers metabolise faster (~3-4h). Pregnancy slows it (~9-11h).
              </p>
            </div>
          )}
        </div>

        {/* Hat hook */}
        <div style={{ textAlign: "center", padding: "20px 0 40px" }}>
          <a
            href="https://randomorium.ai"
            style={{ fontSize: 13, color: C.textDim, textDecoration: "none" }}
          >
            Still wired? A hat won&apos;t help, but it won&apos;t hurt either →
          </a>
        </div>
      </div>
    </div>
  )
}
