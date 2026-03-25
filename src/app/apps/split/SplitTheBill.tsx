"use client"

import { useState, useCallback, useReducer, useEffect, useRef, useMemo } from "react"
import Link from "next/link"

// ── Palette (warm, dinner-table feel) ───────────────────────────────────────
const C = {
  bg: "#FDFBF7",
  surface: "#FFFFFF",
  surfaceAlt: "#F5F0E8",
  border: "#E5DFD3",
  borderFocus: "#B8860B",
  text: "#1C1917",
  textMid: "#78716C",
  textDim: "#A8A29E",
  accent: "#B8860B",
  accentBg: "#FEF3C7",
  accentHover: "#996515",
  green: "#16A34A",
  greenBg: "#DCFCE7",
  red: "#DC2626",
  redBg: "#FEE2E2",
  blue: "#2563EB",
  blueBg: "#DBEAFE",
}

// ── Types ───────────────────────────────────────────────────────────────────
interface Person {
  id: string
  name: string
}

interface Item {
  id: string
  name: string
  price: number
  sharedBy: string[] // person IDs — empty means split among everyone
}

interface State {
  people: Person[]
  items: Item[]
  tipPercent: number
  currency: string
  mounted: boolean
}

const CURRENCIES = ["£", "$", "€"]
const TIP_PRESETS = [0, 10, 12.5, 15, 20]

const STORAGE_KEY = "split_bill_v1"

// ── Persistence ─────────────────────────────────────────────────────────────
function loadSaved(): Partial<State> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { currency: parsed.currency, tipPercent: parsed.tipPercent }
    }
  } catch { /* ignore */ }
  return {}
}

function savePrefs(state: State) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ currency: state.currency, tipPercent: state.tipPercent })
    )
  } catch { /* ignore */ }
}

// ── Reducer (React 19 compliant) ────────────────────────────────────────────
type Action =
  | { type: "hydrate" }
  | { type: "add_person"; name: string }
  | { type: "remove_person"; id: string }
  | { type: "rename_person"; id: string; name: string }
  | { type: "add_item"; name: string; price: number }
  | { type: "remove_item"; id: string }
  | { type: "update_item"; id: string; name?: string; price?: number }
  | { type: "toggle_share"; itemId: string; personId: string }
  | { type: "share_all"; itemId: string }
  | { type: "set_tip"; percent: number }
  | { type: "set_currency"; currency: string }
  | { type: "clear_all" }

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate": {
      const saved = loadSaved()
      return {
        ...state,
        currency: saved.currency ?? state.currency,
        tipPercent: saved.tipPercent ?? state.tipPercent,
        mounted: true,
      }
    }
    case "add_person":
      return {
        ...state,
        people: [...state.people, { id: uid(), name: action.name }],
      }
    case "remove_person":
      return {
        ...state,
        people: state.people.filter((p) => p.id !== action.id),
        items: state.items.map((item) => ({
          ...item,
          sharedBy: item.sharedBy.filter((pid) => pid !== action.id),
        })),
      }
    case "rename_person":
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.id ? { ...p, name: action.name } : p
        ),
      }
    case "add_item":
      return {
        ...state,
        items: [
          ...state.items,
          { id: uid(), name: action.name, price: action.price, sharedBy: [] },
        ],
      }
    case "remove_item":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) }
    case "update_item":
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id
            ? {
                ...i,
                name: action.name ?? i.name,
                price: action.price ?? i.price,
              }
            : i
        ),
      }
    case "toggle_share": {
      return {
        ...state,
        items: state.items.map((item) => {
          if (item.id !== action.itemId) return item
          const has = item.sharedBy.includes(action.personId)
          return {
            ...item,
            sharedBy: has
              ? item.sharedBy.filter((id) => id !== action.personId)
              : [...item.sharedBy, action.personId],
          }
        }),
      }
    }
    case "share_all":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.itemId ? { ...item, sharedBy: [] } : item
        ),
      }
    case "set_tip":
      return { ...state, tipPercent: action.percent }
    case "set_currency":
      return { ...state, currency: action.currency }
    case "clear_all":
      return {
        ...state,
        people: [
          { id: uid(), name: "You" },
          { id: uid(), name: "" },
        ],
        items: [],
        tipPercent: state.tipPercent,
      }
    default:
      return state
  }
}

const initialState: State = {
  people: [
    { id: uid(), name: "You" },
    { id: uid(), name: "" },
  ],
  items: [],
  tipPercent: 10,
  currency: "£",
  mounted: false,
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number, currency: string): string {
  return `${currency}${n.toFixed(2)}`
}

// ── Dry commentary based on situation ───────────────────────────────────────
function getVerdict(perPerson: Map<string, number>, people: Person[]): string {
  if (people.length === 0) return ""
  const amounts = Array.from(perPerson.values())
  if (amounts.length === 0) return "Add some items to split."
  const max = Math.max(...amounts)
  const min = Math.min(...amounts)
  const diff = max - min

  if (amounts.every((a) => a === 0)) return "A free meal. Suspicious."
  if (diff < 0.5) return "Perfectly even. No drama tonight."
  if (diff < 5) return "Close enough. Nobody's complaining."
  if (diff < 20) return "Someone had the steak."
  if (diff < 50) return "This is going to be an awkward conversation."
  return "You need separate bills. And possibly separate tables."
}

// ── Component ───────────────────────────────────────────────────────────────
export default function SplitTheBill() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { people, items, tipPercent, currency, mounted } = state

  // Hydrate from localStorage
  useEffect(() => {
    dispatch({ type: "hydrate" })
  }, [])

  // Persist prefs on change
  useEffect(() => {
    if (mounted) savePrefs(state)
  }, [currency, tipPercent, mounted]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Item form state ─────────────────────────────────────────────────────
  const [newItemName, setNewItemName] = useState("")
  const [newItemPrice, setNewItemPrice] = useState("")
  const itemNameRef = useRef<HTMLInputElement>(null)

  // ── Person form state ───────────────────────────────────────────────────
  const [newPersonName, setNewPersonName] = useState("")

  // ── Calculations ────────────────────────────────────────────────────────
  const subtotal = items.reduce((sum, i) => sum + i.price, 0)
  const tipAmount = subtotal * (tipPercent / 100)
  const total = subtotal + tipAmount
  const tipMultiplier = 1 + tipPercent / 100

  // Per-person breakdown
  const perPerson = useMemo(() => {
    const map = new Map<string, number>()
    people.forEach((p) => map.set(p.id, 0))
    items.forEach((item) => {
      const sharers =
        item.sharedBy.length === 0 ? people.map((p) => p.id) : item.sharedBy
      const perShare = (item.price * tipMultiplier) / sharers.length
      sharers.forEach((pid) => {
        if (map.has(pid)) {
          map.set(pid, (map.get(pid) ?? 0) + perShare)
        }
      })
    })
    return map
  }, [people, items, tipMultiplier])

  const verdict = getVerdict(perPerson, people)

  // ── Handlers ──────────────────────────────────────────────────────────
  const addPerson = useCallback(() => {
    const name = newPersonName.trim()
    if (!name) return
    dispatch({ type: "add_person", name })
    setNewPersonName("")
  }, [newPersonName])

  const addItem = useCallback(() => {
    const name = newItemName.trim() || "Item"
    const price = parseFloat(newItemPrice)
    if (isNaN(price) || price <= 0) return
    dispatch({ type: "add_item", name, price })
    setNewItemName("")
    setNewItemPrice("")
    itemNameRef.current?.focus()
  }, [newItemName, newItemPrice])

  const copyResults = useCallback(() => {
    const lines = people
      .map((p) => {
        const amount = perPerson.get(p.id) ?? 0
        const name = p.name || "???"
        return `${name}: ${fmt(amount, currency)}`
      })
      .join("\n")
    const text = `Bill split (${fmt(total, currency)} total, ${tipPercent}% tip):\n${lines}`
    navigator.clipboard.writeText(text)
  }, [people, perPerson, total, tipPercent, currency])

  // ── Loading state ─────────────────────────────────────────────────────
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

  // ── Shared styles ─────────────────────────────────────────────────────
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
    textTransform: "uppercase" as const,
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

  const chipStyle = (active: boolean): React.CSSProperties => ({
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    border: active ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
    background: active ? C.accentBg : "transparent",
    color: active ? C.accent : C.textMid,
    marginRight: 6,
    marginBottom: 6,
    fontFamily: "inherit",
  })

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
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          padding: "40px 20px 20px",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: 12,
            color: C.textDim,
            textDecoration: "none",
            display: "inline-block",
            marginBottom: 20,
          }}
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
          Split the Bill
        </h1>
        <p style={{ fontSize: 15, color: C.textMid, margin: "6px 0 0" }}>
          Itemised splitting. No arguments. Minimal eye contact.
        </p>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 20px 40px" }}>
        {/* Currency & Tip row */}
        <div
          style={{
            ...sectionStyle,
            display: "flex",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "0 0 auto" }}>
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
                    border:
                      c === currency
                        ? `1px solid ${C.accent}`
                        : `1px solid ${C.border}`,
                    minWidth: 36,
                    textAlign: "center",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <span style={labelStyle}>Tip</span>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {TIP_PRESETS.map((t) => (
                <button
                  key={t}
                  onClick={() => dispatch({ type: "set_tip", percent: t })}
                  style={{
                    ...btnSmall,
                    background: t === tipPercent ? C.accent : "transparent",
                    color: t === tipPercent ? "#FFF" : C.textMid,
                    border:
                      t === tipPercent
                        ? `1px solid ${C.accent}`
                        : `1px solid ${C.border}`,
                  }}
                >
                  {t === 0 ? "None" : `${t}%`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* People */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Who&apos;s here?</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {people.map((p, idx) => (
              <div
                key={p.id}
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={p.name}
                  placeholder={`Person ${idx + 1}`}
                  onChange={(e) =>
                    dispatch({
                      type: "rename_person",
                      id: p.id,
                      name: e.target.value,
                    })
                  }
                />
                {people.length > 1 && (
                  <button
                    onClick={() =>
                      dispatch({ type: "remove_person", id: p.id })
                    }
                    style={{
                      ...btnSmall,
                      color: C.red,
                      border: `1px solid ${C.redBg}`,
                      padding: "4px 8px",
                    }}
                    title="Remove"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 10,
              alignItems: "center",
            }}
          >
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={newPersonName}
              placeholder="Add someone…"
              onChange={(e) => setNewPersonName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPerson()}
            />
            <button
              onClick={addPerson}
              style={{ ...btnStyle, padding: "8px 14px" }}
            >
              +
            </button>
          </div>
        </div>

        {/* Items */}
        <div style={sectionStyle}>
          <span style={labelStyle}>What was ordered?</span>

          {items.length === 0 && (
            <p
              style={{
                color: C.textDim,
                fontSize: 14,
                margin: "0 0 12px",
                fontStyle: "italic",
              }}
            >
              Add items from the bill below.
            </p>
          )}

          {items.map((item) => {
            const sharers =
              item.sharedBy.length === 0
                ? people.map((p) => p.id)
                : item.sharedBy
            const allShared = item.sharedBy.length === 0
            const perShare = sharers.length > 0 ? item.price / sharers.length : 0

            return (
              <div
                key={item.id}
                style={{
                  background: C.surfaceAlt,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  marginBottom: 10,
                }}
              >
                {/* Item header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: "flex", gap: 8, flex: 1, alignItems: "center" }}>
                    <input
                      style={{
                        ...inputStyle,
                        background: "transparent",
                        border: "none",
                        padding: "2px 0",
                        fontWeight: 600,
                        fontSize: 15,
                        flex: 1,
                      }}
                      value={item.name}
                      onChange={(e) =>
                        dispatch({
                          type: "update_item",
                          id: item.id,
                          name: e.target.value,
                        })
                      }
                    />
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: C.text,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmt(item.price, currency)}
                    </span>
                  </div>
                  <button
                    onClick={() => dispatch({ type: "remove_item", id: item.id })}
                    style={{
                      ...btnSmall,
                      color: C.red,
                      border: "none",
                      marginLeft: 8,
                    }}
                    title="Remove item"
                  >
                    ✕
                  </button>
                </div>

                {/* Who's sharing? */}
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: C.textDim,
                      marginBottom: 6,
                    }}
                  >
                    Split between:{" "}
                    {allShared ? (
                      <span style={{ color: C.accent }}>everyone</span>
                    ) : (
                      <span>
                        {sharers.length} of {people.length}
                      </span>
                    )}
                    {sharers.length > 0 && (
                      <span style={{ color: C.textDim }}>
                        {" "}
                        · {fmt(perShare, currency)} each
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    <button
                      onClick={() =>
                        dispatch({ type: "share_all", itemId: item.id })
                      }
                      style={chipStyle(allShared)}
                    >
                      Everyone
                    </button>
                    {people.map((p) => {
                      const active =
                        !allShared && item.sharedBy.includes(p.id)
                      return (
                        <button
                          key={p.id}
                          onClick={() =>
                            dispatch({
                              type: "toggle_share",
                              itemId: item.id,
                              personId: p.id,
                            })
                          }
                          style={chipStyle(active)}
                        >
                          {p.name || "???"}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Add item form */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: items.length > 0 ? 4 : 0,
              alignItems: "center",
            }}
          >
            <input
              ref={itemNameRef}
              style={{ ...inputStyle, flex: 2 }}
              value={newItemName}
              placeholder="Item name…"
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addItem()
              }}
            />
            <div style={{ position: "relative", flex: 1 }}>
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
                value={newItemPrice}
                placeholder="0.00"
                type="number"
                step="0.01"
                min="0"
                onChange={(e) => setNewItemPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addItem()
                }}
              />
            </div>
            <button
              onClick={addItem}
              style={{ ...btnStyle, padding: "8px 14px" }}
            >
              +
            </button>
          </div>
        </div>

        {/* Quick split (no items mode) */}
        {items.length === 0 && people.length >= 2 && (
          <QuickSplit
            people={people}
            tipPercent={tipPercent}
            currency={currency}
            sectionStyle={sectionStyle}
            labelStyle={labelStyle}
            inputStyle={inputStyle}
          />
        )}

        {/* Summary */}
        {items.length > 0 && (
          <div style={sectionStyle}>
            <span style={labelStyle}>The damage</span>

            {/* Subtotal / tip / total row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 14,
                color: C.textMid,
                marginBottom: 4,
              }}
            >
              <span>Subtotal</span>
              <span>{fmt(subtotal, currency)}</span>
            </div>
            {tipPercent > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 14,
                  color: C.textMid,
                  marginBottom: 4,
                }}
              >
                <span>Tip ({tipPercent}%)</span>
                <span>{fmt(tipAmount, currency)}</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 18,
                fontWeight: 700,
                color: C.text,
                padding: "10px 0",
                borderTop: `1px solid ${C.border}`,
                marginTop: 8,
              }}
            >
              <span>Total</span>
              <span>{fmt(total, currency)}</span>
            </div>

            {/* Per-person breakdown */}
            <div style={{ marginTop: 16 }}>
              <span style={labelStyle}>Per person</span>
              {people.map((p) => {
                const amount = perPerson.get(p.id) ?? 0
                const pct = total > 0 ? (amount / total) * 100 : 0
                return (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 15,
                          color: C.text,
                        }}
                      >
                        {p.name || "???"}
                      </div>
                      <div style={{ fontSize: 12, color: C.textDim }}>
                        {pct.toFixed(0)}% of the bill
                      </div>
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 18,
                        color: C.text,
                      }}
                    >
                      {fmt(amount, currency)}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Verdict */}
            {verdict && (
              <p
                style={{
                  fontSize: 14,
                  color: C.textMid,
                  fontStyle: "italic",
                  textAlign: "center",
                  margin: "16px 0 0",
                }}
              >
                {verdict}
              </p>
            )}

            {/* Copy & clear */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 16,
                justifyContent: "center",
              }}
            >
              <button onClick={copyResults} style={btnStyle}>
                Copy to clipboard
              </button>
              <button
                onClick={() => dispatch({ type: "clear_all" })}
                style={{
                  ...btnSmall,
                  color: C.red,
                  border: `1px solid ${C.border}`,
                }}
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        {/* Hat hook */}
        <div style={{ textAlign: "center", padding: "20px 0 40px" }}>
          <a
            href="https://randomorium.ai"
            style={{
              fontSize: 13,
              color: C.textDim,
              textDecoration: "none",
            }}
          >
            Still arguing about the bill? Buy everyone a hat instead →
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Quick split (when no items added, just divide a total evenly) ───────────
function QuickSplit({
  people,
  tipPercent,
  currency,
  sectionStyle,
  labelStyle,
  inputStyle,
}: {
  people: Person[]
  tipPercent: number
  currency: string
  sectionStyle: React.CSSProperties
  labelStyle: React.CSSProperties
  inputStyle: React.CSSProperties
}) {
  const [quickTotal, setQuickTotal] = useState("")
  const total = parseFloat(quickTotal) || 0
  const withTip = total * (1 + tipPercent / 100)
  const perPerson = people.length > 0 ? withTip / people.length : 0

  const copyQuick = useCallback(() => {
    if (total <= 0) return
    const lines = people
      .map((p) => `${p.name || "???"}: ${fmt(perPerson, currency)}`)
      .join("\n")
    const text = `Bill split (${fmt(withTip, currency)} total, ${tipPercent}% tip, ${people.length} people):\n${lines}`
    navigator.clipboard.writeText(text)
  }, [people, perPerson, withTip, tipPercent, currency, total])

  return (
    <div style={sectionStyle}>
      <span style={labelStyle}>Quick even split</span>
      <p
        style={{
          fontSize: 13,
          color: C.textDim,
          margin: "0 0 12px",
        }}
      >
        Just splitting the total equally? Enter the bill amount.
      </p>
      <div style={{ position: "relative", marginBottom: 16 }}>
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
          value={quickTotal}
          placeholder="0.00"
          onChange={(e) => setQuickTotal(e.target.value)}
        />
      </div>
      {total > 0 && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 14,
              color: C.textMid,
              marginBottom: 4,
            }}
          >
            {people.length} {people.length === 1 ? "person" : "people"}
            {tipPercent > 0 ? ` · ${tipPercent}% tip` : ""}
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: C.text,
              letterSpacing: "-0.02em",
            }}
          >
            {fmt(perPerson, currency)}
            <span
              style={{ fontSize: 16, fontWeight: 400, color: C.textMid }}
            >
              {" "}
              each
            </span>
          </div>
          {tipPercent > 0 && (
            <div
              style={{ fontSize: 13, color: C.textDim, marginTop: 4 }}
            >
              {fmt(withTip, currency)} total with tip
            </div>
          )}
          <button
            onClick={copyQuick}
            style={{
              ...({
                background: C.accent,
                color: "#FFF",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }),
              marginTop: 12,
            }}
          >
            Copy to clipboard
          </button>
        </div>
      )}
    </div>
  )
}
