"use client"

import { useState, useEffect, useReducer, useCallback, useMemo } from "react"
import Link from "next/link"

// ── Palette (receipts & reality checks) ─────────────────────────────────────
const C = {
  bg: "#FAF9F7",
  surface: "#FFFFFF",
  surfaceAlt: "#F3F1ED",
  border: "#E5E2DB",
  text: "#1C1917",
  textMid: "#6B6560",
  textDim: "#A39E97",
  accent: "#D94F04",
  accentBg: "#FFF4ED",
  accentHover: "#B84000",
  green: "#16A34A",
  greenBg: "#F0FDF4",
  red: "#DC2626",
  redBg: "#FEF2F2",
}

// ── Types ───────────────────────────────────────────────────────────────────
type Frequency = "daily" | "weekly" | "monthly" | "yearly"

interface Expense {
  id: string
  name: string
  amount: number
  frequency: Frequency
}

interface State {
  expenses: Expense[]
  currency: string
  hourlyRate: number // 0 = not set
  mounted: boolean
}

const STORAGE_KEY = "worth_it_v1"
const CURRENCIES = ["£", "$", "€"]

const FREQ_LABELS: Record<Frequency, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  yearly: "year",
}

const FREQ_TO_YEARLY: Record<Frequency, number> = {
  daily: 365,
  weekly: 52,
  monthly: 12,
  yearly: 1,
}

// ── Comparisons database ────────────────────────────────────────────────────
const COMPARISONS = [
  { name: "a coffee", amount: 4 },
  { name: "a pint at the pub", amount: 6.5 },
  { name: "a takeaway pizza", amount: 15 },
  { name: "a cinema ticket", amount: 14 },
  { name: "a Spotify subscription (yearly)", amount: 120 },
  { name: "a gym membership (yearly)", amount: 360 },
  { name: "a weekend away", amount: 400 },
  { name: "a new iPhone", amount: 1200 },
  { name: "a week in Barcelona", amount: 1800 },
  { name: "a month's rent (UK avg)", amount: 1300 },
  { name: "a used car", amount: 5000 },
  { name: "a round-the-world flight", amount: 3500 },
  { name: "a fancy watch", amount: 8000 },
  { name: "a kitchen renovation", amount: 15000 },
  { name: "a deposit on a flat", amount: 30000 },
]

function getBestComparison(yearlyAmount: number): string | null {
  // Find the closest comparison that's <= yearly amount
  const matches = COMPARISONS.filter((c) => c.amount <= yearlyAmount * 1.1)
  if (matches.length === 0) return null
  const best = matches.reduce((prev, curr) =>
    Math.abs(curr.amount - yearlyAmount) < Math.abs(prev.amount - yearlyAmount)
      ? curr
      : prev
  )
  const count = yearlyAmount / best.amount
  if (count >= 1.8) {
    return `That's ${Math.floor(count)}× ${best.name} every year`
  }
  if (count >= 0.9) {
    return `That's about the same as ${best.name}`
  }
  return `That's ${Math.round(count * 100)}% of the way to ${best.name}`
}

// ── Quick-add presets ───────────────────────────────────────────────────────
const PRESETS = [
  { name: "Morning coffee", amount: 4, frequency: "daily" as Frequency, icon: "☕" },
  { name: "Lunch out", amount: 10, frequency: "daily" as Frequency, icon: "🥪" },
  { name: "Takeaway", amount: 25, frequency: "weekly" as Frequency, icon: "🍕" },
  { name: "Netflix", amount: 11, frequency: "monthly" as Frequency, icon: "📺" },
  { name: "Spotify", amount: 11, frequency: "monthly" as Frequency, icon: "🎵" },
  { name: "Gym", amount: 35, frequency: "monthly" as Frequency, icon: "💪" },
  { name: "Phone contract", amount: 30, frequency: "monthly" as Frequency, icon: "📱" },
  { name: "Parking", amount: 8, frequency: "daily" as Frequency, icon: "🅿️" },
]

// ── Reducer ─────────────────────────────────────────────────────────────────
type Action =
  | { type: "hydrate"; expenses: Expense[]; currency: string; hourlyRate: number }
  | { type: "add_expense"; expense: Expense }
  | { type: "remove_expense"; id: string }
  | { type: "update_expense"; id: string; name?: string; amount?: number; frequency?: Frequency }
  | { type: "set_currency"; currency: string }
  | { type: "set_hourly_rate"; rate: number }
  | { type: "clear_all" }

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return {
        ...state,
        expenses: action.expenses,
        currency: action.currency,
        hourlyRate: action.hourlyRate,
        mounted: true,
      }
    case "add_expense":
      return { ...state, expenses: [...state.expenses, action.expense] }
    case "remove_expense":
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) }
    case "update_expense":
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.id
            ? {
                ...e,
                name: action.name ?? e.name,
                amount: action.amount ?? e.amount,
                frequency: action.frequency ?? e.frequency,
              }
            : e
        ),
      }
    case "set_currency":
      return { ...state, currency: action.currency }
    case "set_hourly_rate":
      return { ...state, hourlyRate: action.rate }
    case "clear_all":
      return { ...state, expenses: [] }
    default:
      return state
  }
}

const INIT: State = {
  expenses: [],
  currency: "£",
  hourlyRate: 0,
  mounted: false,
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number, currency: string): string {
  if (n >= 10000) return `${currency}${Math.round(n).toLocaleString()}`
  if (n >= 100) return `${currency}${Math.round(n).toLocaleString()}`
  return `${currency}${n.toFixed(2)}`
}

function yearlyAmount(expense: Expense): number {
  return expense.amount * FREQ_TO_YEARLY[expense.frequency]
}

function formatWorkTime(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} minutes`
  if (hours < 24) {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return m > 0 ? `${h}h ${m}m` : `${h} hour${h !== 1 ? "s" : ""}`
  }
  const days = hours / 8 // working days
  if (days < 5) return `${days.toFixed(1)} work days`
  const weeks = days / 5
  if (weeks < 52) return `${weeks.toFixed(1)} work weeks`
  const months = weeks / 4.33
  return `${months.toFixed(1)} work months`
}

// ── Component ───────────────────────────────────────────────────────────────
export default function WorthIt() {
  const [state, dispatch] = useReducer(reducer, INIT)
  const { expenses, currency, hourlyRate, mounted } = state

  // Form state
  const [newName, setNewName] = useState("")
  const [newAmount, setNewAmount] = useState("")
  const [newFreq, setNewFreq] = useState<Frequency>("daily")
  const [showPresets, setShowPresets] = useState(true)

  // Hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        dispatch({
          type: "hydrate",
          expenses: saved.expenses ?? [],
          currency: saved.currency ?? "£",
          hourlyRate: saved.hourlyRate ?? 0,
        })
      } else {
        dispatch({ type: "hydrate", expenses: [], currency: "£", hourlyRate: 0 })
      }
    } catch {
      dispatch({ type: "hydrate", expenses: [], currency: "£", hourlyRate: 0 })
    }
  }, [])

  // Persist
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ expenses, currency, hourlyRate })
      )
    } catch { /* ignore */ }
  }, [expenses, currency, hourlyRate, mounted])

  // ── Calculations ────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const yearly = expenses.reduce((sum, e) => sum + yearlyAmount(e), 0)
    return {
      daily: yearly / 365,
      weekly: yearly / 52,
      monthly: yearly / 12,
      yearly,
      fiveYear: yearly * 5,
      tenYear: yearly * 10,
    }
  }, [expenses])

  const comparison = useMemo(
    () => (totals.yearly > 0 ? getBestComparison(totals.yearly) : null),
    [totals.yearly]
  )

  const workHoursYearly = useMemo(
    () => (hourlyRate > 0 ? totals.yearly / hourlyRate : 0),
    [totals.yearly, hourlyRate]
  )

  // ── Handlers ──────────────────────────────────────────────────────────
  const addExpense = useCallback(() => {
    const amount = parseFloat(newAmount)
    if (isNaN(amount) || amount <= 0) return
    dispatch({
      type: "add_expense",
      expense: {
        id: uid(),
        name: newName.trim() || "Expense",
        amount,
        frequency: newFreq,
      },
    })
    setNewName("")
    setNewAmount("")
    setShowPresets(false)
  }, [newName, newAmount, newFreq])

  const addPreset = useCallback(
    (preset: (typeof PRESETS)[number]) => {
      dispatch({
        type: "add_expense",
        expense: {
          id: uid(),
          name: preset.name,
          amount: preset.amount,
          frequency: preset.frequency,
        },
      })
      setShowPresets(false)
    },
    []
  )

  const copyResults = useCallback(() => {
    const lines = expenses.map(
      (e) =>
        `${e.name}: ${fmt(e.amount, currency)}/${FREQ_LABELS[e.frequency]} = ${fmt(yearlyAmount(e), currency)}/year`
    )
    const text = [
      `Worth It? — Expense audit`,
      ``,
      ...lines,
      ``,
      `Total: ${fmt(totals.yearly, currency)}/year (${fmt(totals.monthly, currency)}/month)`,
      hourlyRate > 0
        ? `That's ${formatWorkTime(workHoursYearly)} of work per year.`
        : "",
      comparison ?? "",
    ]
      .filter(Boolean)
      .join("\n")
    navigator.clipboard.writeText(text)
  }, [expenses, currency, totals, hourlyRate, workHoursYearly, comparison])

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

  const btnStyle: React.CSSProperties = {
    background: C.accent,
    color: "#FFF",
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
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
          Worth It?
        </h1>
        <p style={{ fontSize: 15, color: C.textMid, margin: "6px 0 0" }}>
          See what your small expenses actually cost you over time.
        </p>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 20px 40px" }}>
        {/* Currency & hourly rate */}
        <div
          style={{
            ...sectionStyle,
            display: "flex",
            gap: 20,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div>
            <span style={labelStyle}>Currency</span>
            <div style={{ display: "flex", gap: 4 }}>
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  onClick={() => dispatch({ type: "set_currency", currency: c })}
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
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <span style={labelStyle}>Your hourly rate (optional)</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: C.textDim,
                    fontSize: 14,
                    pointerEvents: "none",
                  }}
                >
                  {currency}
                </span>
                <input
                  style={{ ...inputStyle, paddingLeft: 28 }}
                  type="number"
                  min="0"
                  step="1"
                  value={hourlyRate || ""}
                  placeholder="0"
                  onChange={(e) =>
                    dispatch({
                      type: "set_hourly_rate",
                      rate: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <span style={{ fontSize: 13, color: C.textDim, whiteSpace: "nowrap" }}>
                /hr
              </span>
            </div>
            <p style={{ fontSize: 11, color: C.textDim, margin: "4px 0 0" }}>
              Converts costs into hours of your life
            </p>
          </div>
        </div>

        {/* Quick-add presets */}
        {showPresets && expenses.length === 0 && (
          <div style={sectionStyle}>
            <span style={labelStyle}>Quick add</span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 8,
              }}
            >
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => addPreset(p)}
                  style={{
                    background: C.surfaceAlt,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding: "10px 12px",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = C.accent
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = C.border
                  }}
                >
                  <div style={{ fontSize: 14, marginBottom: 2 }}>{p.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: C.textDim }}>
                    {currency}{p.amount}/{FREQ_LABELS[p.frequency]}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Expense list */}
        {expenses.length > 0 && (
          <div style={sectionStyle}>
            <span style={labelStyle}>Your expenses</span>
            {expenses.map((e) => {
              const yearly = yearlyAmount(e)
              const workHours = hourlyRate > 0 ? yearly / hourlyRate : 0
              return (
                <div
                  key={e.id}
                  style={{
                    background: C.surfaceAlt,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding: "14px",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: C.text,
                          marginBottom: 2,
                        }}
                      >
                        {e.name}
                      </div>
                      <div style={{ fontSize: 13, color: C.textMid }}>
                        {fmt(e.amount, currency)}/{FREQ_LABELS[e.frequency]}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        dispatch({ type: "remove_expense", id: e.id })
                      }
                      style={{
                        ...btnSmall,
                        color: C.red,
                        border: `1px solid ${C.redBg}`,
                        padding: "2px 8px",
                        fontSize: 11,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  {/* Projections */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 8,
                      marginTop: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: C.textDim }}>Monthly</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                        {fmt(yearly / 12, currency)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: C.textDim }}>Yearly</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>
                        {fmt(yearly, currency)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: C.textDim }}>5 years</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                        {fmt(yearly * 5, currency)}
                      </div>
                    </div>
                  </div>
                  {workHours > 0 && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: "6px 10px",
                        background: C.accentBg,
                        borderRadius: 6,
                        fontSize: 12,
                        color: C.accent,
                      }}
                    >
                      = {formatWorkTime(workHours)} of work per year
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Add expense form */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Add expense</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              style={{ ...inputStyle, flex: "2 1 120px" }}
              value={newName}
              placeholder="What is it?"
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addExpense()}
            />
            <div style={{ position: "relative", flex: "1 1 80px" }}>
              <span
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: C.textDim,
                  fontSize: 15,
                  pointerEvents: "none",
                }}
              >
                {currency}
              </span>
              <input
                style={{ ...inputStyle, paddingLeft: 28 }}
                value={newAmount}
                placeholder="0.00"
                type="number"
                step="0.01"
                min="0"
                onChange={(e) => setNewAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addExpense()}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
            {(Object.keys(FREQ_LABELS) as Frequency[]).map((f) => (
              <button
                key={f}
                onClick={() => setNewFreq(f)}
                style={{
                  ...btnSmall,
                  flex: 1,
                  textAlign: "center",
                  background: f === newFreq ? C.accent : "transparent",
                  color: f === newFreq ? "#FFF" : C.textMid,
                  border: `1px solid ${f === newFreq ? C.accent : C.border}`,
                }}
              >
                {FREQ_LABELS[f]}
              </button>
            ))}
          </div>
          <button
            onClick={addExpense}
            style={{ ...btnStyle, width: "100%", marginTop: 10, padding: "10px 16px" }}
          >
            Add expense
          </button>
        </div>

        {/* Grand total */}
        {expenses.length > 0 && (
          <div
            style={{
              ...sectionStyle,
              background: C.accent,
              border: "none",
              color: "#FFF",
            }}
          >
            <span
              style={{
                ...labelStyle,
                color: "rgba(255,255,255,0.7)",
              }}
            >
              The full picture
            </span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Per month</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>
                  {fmt(totals.monthly, currency)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Per year</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>
                  {fmt(totals.yearly, currency)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Over 5 years</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  {fmt(totals.fiveYear, currency)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Over 10 years</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  {fmt(totals.tenYear, currency)}
                </div>
              </div>
            </div>

            {/* Work-hours total */}
            {hourlyRate > 0 && (
              <div
                style={{
                  marginTop: 14,
                  padding: "10px 14px",
                  background: "rgba(0,0,0,0.15)",
                  borderRadius: 8,
                  fontSize: 14,
                }}
              >
                That&apos;s{" "}
                <strong>{formatWorkTime(workHoursYearly)}</strong> of your working
                life every year, just on these {expenses.length} things.
              </div>
            )}

            {/* Comparison */}
            {comparison && (
              <p
                style={{
                  marginTop: 12,
                  marginBottom: 0,
                  fontSize: 14,
                  fontStyle: "italic",
                  opacity: 0.85,
                }}
              >
                {comparison}
              </p>
            )}

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 16,
              }}
            >
              <button
                onClick={copyResults}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "#FFF",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  flex: 1,
                }}
              >
                Copy results
              </button>
              <button
                onClick={() => dispatch({ type: "clear_all" })}
                style={{
                  background: "transparent",
                  color: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Start over
              </button>
            </div>
          </div>
        )}

        {/* Hat hook */}
        <div style={{ textAlign: "center", padding: "20px 0 40px" }}>
          <a
            href="https://randomorium.ai"
            style={{ fontSize: 13, color: C.textDim, textDecoration: "none" }}
          >
            Is a hat worth it? Absolutely. Always. →
          </a>
        </div>
      </div>
    </div>
  )
}
