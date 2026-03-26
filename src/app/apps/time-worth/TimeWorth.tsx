"use client"

import { useState, useEffect, useReducer, useCallback, useRef, useMemo } from "react"
import Link from "next/link"

// ── Palette (money green, professional) ─────────────────────────────────────
const C = {
  bg: "#F7FAF8",
  surface: "#FFFFFF",
  surfaceAlt: "#EDF5F0",
  border: "#D5E5DA",
  text: "#1A2B21",
  textMid: "#5E7668",
  textDim: "#94A89E",
  accent: "#059669",
  accentBg: "#D1FAE5",
  accentHover: "#047857",
  accentDark: "#064E3B",
  red: "#DC2626",
  redBg: "#FEF2F2",
  amber: "#D97706",
  amberBg: "#FFFBEB",
}

// ── Types & Constants ───────────────────────────────────────────────────────
const STORAGE_KEY = "time_worth_v1"
const CURRENCIES = ["£", "$", "€"]

interface State {
  salary: number
  taxRate: number
  hoursPerWeek: number
  daysOff: number
  currency: string
  mounted: boolean
}

type Action =
  | { type: "hydrate"; data: Partial<State> }
  | { type: "set"; key: keyof State; value: State[keyof State] }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return {
        ...state,
        salary: action.data.salary ?? state.salary,
        taxRate: action.data.taxRate ?? state.taxRate,
        hoursPerWeek: action.data.hoursPerWeek ?? state.hoursPerWeek,
        daysOff: action.data.daysOff ?? state.daysOff,
        currency: action.data.currency ?? state.currency,
        mounted: true,
      }
    case "set":
      return { ...state, [action.key]: action.value }
    default:
      return state
  }
}

const INIT: State = {
  salary: 45000,
  taxRate: 25,
  hoursPerWeek: 40,
  daysOff: 33,
  currency: "£",
  mounted: false,
}

const TAX_PRESETS = [
  { label: "None", rate: 0 },
  { label: "Low (20%)", rate: 20 },
  { label: "Medium (25%)", rate: 25 },
  { label: "High (32%)", rate: 32 },
  { label: "Very high (40%)", rate: 40 },
]

// Purchase presets with approximate costs
const PURCHASE_PRESETS = [
  { name: "Coffee", amount: 4, icon: "☕" },
  { name: "Lunch", amount: 10, icon: "🥪" },
  { name: "Pint", amount: 6.5, icon: "🍺" },
  { name: "Takeaway", amount: 25, icon: "🍕" },
  { name: "Trainers", amount: 120, icon: "👟" },
  { name: "PS5 Game", amount: 70, icon: "🎮" },
  { name: "AirPods", amount: 180, icon: "🎧" },
  { name: "iPhone", amount: 1200, icon: "📱" },
  { name: "Rent (month)", amount: 1300, icon: "🏠" },
  { name: "Holiday", amount: 2000, icon: "✈️" },
  { name: "Used car", amount: 5000, icon: "🚗" },
  { name: "Rolex", amount: 8000, icon: "⌚" },
]

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number, currency: string): string {
  if (n >= 1000) return `${currency}${n.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`
  if (n >= 1) return `${currency}${n.toFixed(2)}`
  if (n >= 0.01) return `${currency}${n.toFixed(3)}`
  return `${currency}${n.toFixed(4)}`
}

function formatWorkTime(hours: number): string {
  if (hours < 1 / 60) {
    const seconds = Math.round(hours * 3600)
    return `${seconds} second${seconds !== 1 ? "s" : ""}`
  }
  if (hours < 1) {
    const mins = Math.round(hours * 60)
    return `${mins} minute${mins !== 1 ? "s" : ""}`
  }
  if (hours < 8) {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    if (m === 0) return `${h} hour${h !== 1 ? "s" : ""}`
    return `${h}h ${m}m`
  }
  const days = hours / 8
  if (days < 5) return `${days.toFixed(1)} work days`
  const weeks = days / 5
  if (weeks < 8) return `${weeks.toFixed(1)} work weeks`
  const months = weeks / 4.33
  if (months < 12) return `${months.toFixed(1)} work months`
  const years = months / 12
  return `${years.toFixed(1)} work years`
}

// ── Live counter component ──────────────────────────────────────────────────
interface CounterState {
  earned: number
  elapsedSec: number
}

type CounterAction =
  | { type: "tick"; earned: number; elapsed: number }

function counterReducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case "tick":
      return { earned: action.earned, elapsedSec: action.elapsed }
    default:
      return state
  }
}

function LiveCounter({
  perSecond,
  currency,
}: {
  perSecond: number
  currency: string
}) {
  const [counter, dispatchCounter] = useReducer(counterReducer, { earned: 0, elapsedSec: 0 })
  const startRef = useRef<number>(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    startRef.current = Date.now()

    function tick() {
      const elapsed = (Date.now() - startRef.current) / 1000
      dispatchCounter({ type: "tick", earned: elapsed * perSecond, elapsed })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [perSecond])

  const minutes = Math.floor(counter.elapsedSec / 60)
  const seconds = Math.floor(counter.elapsedSec % 60)

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: C.accent,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {currency}
        {counter.earned < 1 ? counter.earned.toFixed(4) : counter.earned < 100 ? counter.earned.toFixed(2) : counter.earned.toFixed(0)}
      </div>
      <p style={{ fontSize: 13, color: C.textDim, margin: "8px 0 0" }}>
        earned in the last{" "}
        {minutes > 0 ? `${minutes}m ${seconds.toString().padStart(2, "0")}s` : `${seconds}s`}
        {" "}on this page
      </p>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export default function TimeWorth() {
  const [state, dispatch] = useReducer(reducer, INIT)
  const { salary, taxRate, hoursPerWeek, daysOff, currency, mounted } = state
  const [customAmount, setCustomAmount] = useState("")
  const [showSettings, setShowSettings] = useState(false)

  // Hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        dispatch({ type: "hydrate", data: JSON.parse(raw) })
      } else {
        dispatch({ type: "hydrate", data: {} })
      }
    } catch {
      dispatch({ type: "hydrate", data: {} })
    }
  }, [])

  // Persist
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ salary, taxRate, hoursPerWeek, daysOff, currency })
      )
    } catch { /* ignore */ }
  }, [salary, taxRate, hoursPerWeek, daysOff, currency, mounted])

  // ── Calculations ────────────────────────────────────────────────────────
  const breakdown = useMemo(() => {
    const weekendsPerYear = 104
    const workingDays = 365 - weekendsPerYear - daysOff
    const hoursPerDay = hoursPerWeek / 5
    const totalHoursPerYear = workingDays * hoursPerDay

    const preTax = salary
    const postTax = salary * (1 - taxRate / 100)

    return {
      preTax,
      postTax,
      workingDays,
      totalHoursPerYear,
      perMonth: postTax / 12,
      perWeek: postTax / 52,
      perDay: postTax / workingDays,
      perHour: postTax / totalHoursPerYear,
      perMinute: postTax / (totalHoursPerYear * 60),
      perSecond: postTax / (totalHoursPerYear * 3600),
    }
  }, [salary, taxRate, hoursPerWeek, daysOff])

  // Custom purchase amount
  const customPurchaseAmount = parseFloat(customAmount) || 0

  const purchaseHours = useCallback(
    (amount: number) => amount / breakdown.perHour,
    [breakdown.perHour]
  )

  const copyBreakdown = useCallback(() => {
    const lines = [
      `Time Worth — Salary Breakdown`,
      ``,
      `Salary: ${fmt(salary, currency)} (${taxRate}% tax)`,
      `Take-home: ${fmt(breakdown.postTax, currency)}/year`,
      ``,
      `Per month: ${fmt(breakdown.perMonth, currency)}`,
      `Per week: ${fmt(breakdown.perWeek, currency)}`,
      `Per day: ${fmt(breakdown.perDay, currency)}`,
      `Per hour: ${fmt(breakdown.perHour, currency)}`,
      `Per minute: ${fmt(breakdown.perMinute, currency)}`,
      `Per second: ${fmt(breakdown.perSecond, currency)}`,
    ]
    navigator.clipboard.writeText(lines.join("\n"))
  }, [salary, taxRate, currency, breakdown])

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

  const inputStyle: React.CSSProperties = {
    background: C.surfaceAlt,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 15,
    color: C.text,
    outline: "none",
    width: "100%",
    fontFamily: "inherit",
  }

  const btnSmall: React.CSSProperties = {
    background: "transparent",
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: 12,
    color: C.textMid,
    cursor: "pointer",
    fontFamily: "inherit",
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
          Time Worth
        </h1>
        <p style={{ fontSize: 15, color: C.textMid, margin: "6px 0 0" }}>
          What you earn per second — and what everything costs in hours of your life.
        </p>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 20px 40px" }}>
        {/* Salary input */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Annual salary (pre-tax)</span>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
            {/* Currency */}
            <div style={{ display: "flex", gap: 4 }}>
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  onClick={() => dispatch({ type: "set", key: "currency", value: c })}
                  style={{
                    ...btnSmall,
                    background: c === currency ? C.accent : "transparent",
                    color: c === currency ? "#FFF" : C.textMid,
                    border: `1px solid ${c === currency ? C.accent : C.border}`,
                    minWidth: 36,
                    textAlign: "center",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
            {/* Salary */}
            <div style={{ position: "relative", flex: 1 }}>
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: C.textDim,
                  fontSize: 18,
                  fontWeight: 600,
                  pointerEvents: "none",
                }}
              >
                {currency}
              </span>
              <input
                style={{
                  ...inputStyle,
                  paddingLeft: 32,
                  fontSize: 22,
                  fontWeight: 700,
                  padding: "10px 14px 10px 36px",
                }}
                type="number"
                min="0"
                step="1000"
                value={salary}
                onChange={(e) =>
                  dispatch({
                    type: "set",
                    key: "salary",
                    value: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          {/* Tax rate */}
          <span style={labelStyle}>Tax rate</span>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
            {TAX_PRESETS.map((t) => (
              <button
                key={t.rate}
                onClick={() => dispatch({ type: "set", key: "taxRate", value: t.rate })}
                style={{
                  ...btnSmall,
                  background: t.rate === taxRate ? C.accent : "transparent",
                  color: t.rate === taxRate ? "#FFF" : C.textMid,
                  border: `1px solid ${t.rate === taxRate ? C.accent : C.border}`,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={taxRate}
              onChange={(e) =>
                dispatch({ type: "set", key: "taxRate", value: parseInt(e.target.value) })
              }
              style={{ flex: 1, accentColor: C.accent }}
            />
            <span style={{ fontSize: 14, fontWeight: 600, color: C.accent, minWidth: 40 }}>
              {taxRate}%
            </span>
          </div>

          {/* Settings toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              color: C.textDim,
              fontSize: 12,
              padding: 0,
              marginTop: 14,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 10 }}>{showSettings ? "▼" : "▶"}</span>
            Working hours & days off
          </button>
          {showSettings && (
            <div style={{ marginTop: 12, display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: C.textMid, display: "block", marginBottom: 4 }}>
                  Hours/week
                </label>
                <input
                  style={inputStyle}
                  type="number"
                  min="1"
                  max="80"
                  value={hoursPerWeek}
                  onChange={(e) =>
                    dispatch({
                      type: "set",
                      key: "hoursPerWeek",
                      value: parseInt(e.target.value) || 40,
                    })
                  }
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: C.textMid, display: "block", marginBottom: 4 }}>
                  Days off/year
                </label>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  max="100"
                  value={daysOff}
                  onChange={(e) =>
                    dispatch({
                      type: "set",
                      key: "daysOff",
                      value: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <p style={{ fontSize: 10, color: C.textDim, margin: "4px 0 0" }}>
                  UK default: 25 holiday + 8 bank = 33
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Live counter */}
        {salary > 0 && (
          <div style={{ ...sectionStyle, padding: "28px 20px" }}>
            <LiveCounter perSecond={breakdown.perSecond} currency={currency} />
          </div>
        )}

        {/* Breakdown table */}
        {salary > 0 && (
          <div style={sectionStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <span style={labelStyle}>Your take-home breakdown</span>
              <button onClick={copyBreakdown} style={btnSmall}>
                Copy
              </button>
            </div>
            {[
              { label: "Per year", value: breakdown.postTax, bold: true },
              { label: "Per month", value: breakdown.perMonth, bold: false },
              { label: "Per week", value: breakdown.perWeek, bold: false },
              { label: "Per day", value: breakdown.perDay, bold: false },
              { label: "Per hour", value: breakdown.perHour, bold: true },
              { label: "Per minute", value: breakdown.perMinute, bold: false },
              { label: "Per second", value: breakdown.perSecond, bold: false },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    color: row.bold ? C.text : C.textMid,
                    fontWeight: row.bold ? 600 : 400,
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    fontSize: row.bold ? 16 : 14,
                    fontWeight: row.bold ? 700 : 500,
                    color: row.bold ? C.accent : C.text,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {fmt(row.value, currency)}
                </span>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 10,
                fontSize: 12,
                color: C.textDim,
              }}
            >
              <span>
                {breakdown.workingDays} working days ·{" "}
                {Math.round(breakdown.totalHoursPerYear).toLocaleString()} hours/year
              </span>
              <span>
                {fmt(breakdown.preTax - breakdown.postTax, currency)} tax
              </span>
            </div>
          </div>
        )}

        {/* Purchase converter */}
        {salary > 0 && (
          <div style={sectionStyle}>
            <span style={labelStyle}>What does it really cost you?</span>
            <p style={{ fontSize: 13, color: C.textDim, margin: "0 0 14px" }}>
              Enter any price to see it in hours of your working life.
            </p>

            {/* Custom input */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 16,
                alignItems: "center",
              }}
            >
              <div style={{ position: "relative", flex: 1 }}>
                <span
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: C.textDim,
                    fontSize: 20,
                    fontWeight: 600,
                    pointerEvents: "none",
                  }}
                >
                  {currency}
                </span>
                <input
                  style={{
                    ...inputStyle,
                    paddingLeft: 32,
                    fontSize: 24,
                    fontWeight: 700,
                    padding: "12px 14px 12px 36px",
                  }}
                  type="number"
                  step="0.01"
                  min="0"
                  value={customAmount}
                  placeholder="0.00"
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
              </div>
            </div>
            {customPurchaseAmount > 0 && (
              <div
                style={{
                  textAlign: "center",
                  marginBottom: 20,
                  padding: "14px",
                  background: C.accentBg,
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: C.accent,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {formatWorkTime(purchaseHours(customPurchaseAmount))}
                </div>
                <p style={{ fontSize: 13, color: C.textMid, margin: "6px 0 0" }}>
                  of your working life for {fmt(customPurchaseAmount, currency)}
                </p>
              </div>
            )}

            {/* Preset grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: 8,
              }}
            >
              {PURCHASE_PRESETS.map((p) => {
                const hours = purchaseHours(p.amount)
                return (
                  <div
                    key={p.name}
                    style={{
                      background: C.surfaceAlt,
                      border: `1px solid ${C.border}`,
                      borderRadius: 10,
                      padding: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{p.icon}</span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: C.textMid,
                        }}
                      >
                        {fmt(p.amount, currency)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.text,
                        marginBottom: 2,
                      }}
                    >
                      {p.name}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>
                      {formatWorkTime(hours)}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Fun facts */}
            {breakdown.perHour > 0 && (
              <div
                style={{
                  marginTop: 16,
                  padding: "14px",
                  background: C.surfaceAlt,
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                }}
              >
                <span style={{ ...labelStyle, marginBottom: 8 }}>Fun facts</span>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    fontSize: 13,
                    color: C.textMid,
                  }}
                >
                  <p style={{ margin: 0 }}>
                    You earn a coffee ({currency}4) every{" "}
                    <strong style={{ color: C.text }}>
                      {Math.round((4 / breakdown.perHour) * 60)} minutes
                    </strong>
                  </p>
                  <p style={{ margin: 0 }}>
                    Your lunch break ({currency}10) pays for itself in{" "}
                    <strong style={{ color: C.text }}>
                      {Math.round((10 / breakdown.perHour) * 60)} minutes
                    </strong>
                  </p>
                  <p style={{ margin: 0 }}>
                    Every time you blink (~0.4s), you earn{" "}
                    <strong style={{ color: C.text }}>
                      {fmt(breakdown.perSecond * 0.4, currency)}
                    </strong>
                  </p>
                  <p style={{ margin: 0 }}>
                    While you sleep (8h), you could have earned{" "}
                    <strong style={{ color: C.text }}>
                      {fmt(breakdown.perHour * 8, currency)}
                    </strong>
                    . But sleep is free, so you win.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hat hook */}
        <div style={{ textAlign: "center", padding: "20px 0 40px" }}>
          <a
            href="https://randomorium.ai"
            style={{ fontSize: 13, color: C.textDim, textDecoration: "none" }}
          >
            A hat costs {breakdown.perHour > 0 ? formatWorkTime(30 / breakdown.perHour) : "less than you think"} of work. Treat yourself →
          </a>
        </div>
      </div>
    </div>
  )
}
