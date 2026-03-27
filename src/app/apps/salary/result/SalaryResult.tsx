"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { FormData, ScoreResult, PlaybookSection } from "@/lib/salary/types"
import { getHatHook } from "@/lib/salary/scoring"
import { SoukShell, Ornament } from "@/lib/salary/souk-theme"

// ── Sssalem verdict quotes ───────────────────────────────────────────────────
function getVerdict(band: string): string {
  switch (band) {
    case "strong":
      return "The scales tip heavily in your favour, friend. This merchant has undervalued you. Let Sssalem show you what you are truly worth."
    case "good":
      return "A fair position, friend. Worth the conversation. Sssalem has seen far weaker hands win at this table."
    case "possible":
      return "The scales are balanced \u2014 but every merchant knows, a balanced scale can be tipped with the right words."
    case "honest":
      return "Sssalem will not lie to you. The scales are heavy on their side. But there is always something to trade."
    default:
      return "The scales have spoken."
  }
}

// ── Section definitions ──────────────────────────────────────────────────────
const SECTION_DEFS = [
  { id: "counter", eyebrow: "Sssalem's counter-offer", title: "Your number" },
  { id: "negotiable", eyebrow: "Beyond the base salary", title: "What else is on the table" },
  { id: "email", eyebrow: "The message", title: "Ready to send" },
  { id: "script", eyebrow: "The spoken word", title: "Verbal script" },
  { id: "fallback", eyebrow: "If they say no", title: "Sssalem's fallback" },
]

// ── Streaming section names for progress ─────────────────────────────────────
const SECTION_PROGRESS: Record<string, string> = {
  counter: "Writing your counter-offer",
  negotiable: "Listing what else is on the table",
  email: "Drafting the email",
  script: "Preparing the verbal script",
  fallback: "Planning the fallback",
}

// ── Component ────────────────────────────────────────────────────────────────
export default function SalaryResult() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData | null>(null)
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  const [userPrompt, setUserPrompt] = useState<string>("")
  const [sections, setSections] = useState<PlaybookSection[]>(
    SECTION_DEFS.map((d) => ({ id: d.id, title: d.title, content: "", status: "skeleton" as const })),
  )
  const [streamError, setStreamError] = useState<string | null>(null)
  const [streamDone, setStreamDone] = useState(false)
  const [copied, setCopied] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<"email" | "verbal">("email")
  const [openTiers, setOpenTiers] = useState<Record<string, boolean>>({ high: true })
  const abortRef = useRef<AbortController | null>(null)
  const scoreCardRef = useRef<HTMLDivElement>(null)

  // Load from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("salary_negotiator")
      if (!raw) {
        router.replace("/apps/salary")
        return
      }
      const data = JSON.parse(raw)
      if (!data.formData || !data.scoreResult || !data.userPrompt) {
        router.replace("/apps/salary")
        return
      }
      setFormData(data.formData)
      setScoreResult(data.scoreResult)
      setUserPrompt(data.userPrompt)
    } catch {
      router.replace("/apps/salary")
    }
  }, [router])

  // Start streaming when we have a prompt
  useEffect(() => {
    if (!userPrompt) return
    const controller = new AbortController()
    abortRef.current = controller
    startStreaming(userPrompt, controller.signal)
    return () => { controller.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPrompt])

  // Focus score card when loaded for screen readers
  useEffect(() => {
    if (scoreResult && scoreCardRef.current) {
      scoreCardRef.current.focus()
    }
  }, [scoreResult])

  const startStreaming = useCallback(
    async (prompt: string, signal: AbortSignal) => {
      setStreamError(null)
      setStreamDone(false)
      setSections(
        SECTION_DEFS.map((d) => ({ id: d.id, title: d.title, content: "", status: "skeleton" as const })),
      )

      let res: Response
      try {
        res = await fetch("/api/playbook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userPrompt: prompt }),
          signal,
        })
      } catch (err) {
        if (signal.aborted) return
        setStreamError("connection")
        console.error("Fetch error:", err)
        return
      }

      if (!res.ok) {
        try {
          const errData = await res.json()
          console.error("Playbook API error:", res.status, errData)
          if (errData.error === "rate_limit") {
            setStreamError("rate_limit")
          } else if (errData.error === "api_key_missing") {
            setStreamError("api_key_missing")
          } else {
            setStreamError("api_error")
          }
        } catch {
          console.error("Playbook API error: status", res.status)
          setStreamError("api_error")
        }
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setStreamError("api_error")
        return
      }

      const decoder = new TextDecoder()
      let buffer = ""
      let fullText = ""

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const data = line.slice(6).trim()

            if (data === "[DONE]") {
              setStreamDone(true)
              setSections(parseSections(fullText, true))
              return
            }

            try {
              const event = JSON.parse(data)
              if (event.error) {
                setStreamError("api_error")
                return
              }
              if (event.text) {
                fullText += event.text
                setSections(parseSections(fullText, false))
              }
            } catch {
              // skip malformed
            }
          }
        }

        setStreamDone(true)
        setSections(parseSections(fullText, true))
      } catch (err) {
        if (signal.aborted) return
        console.error("Stream read error:", err)
        setStreamError("connection")
      }
    },
    [],
  )

  const handleRetry = useCallback(() => {
    if (!userPrompt) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    startStreaming(userPrompt, controller.signal)
  }, [userPrompt, startStreaming])

  const handleCopy = useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied((prev) => ({ ...prev, [key]: true }))
      setTimeout(() => setCopied((prev) => ({ ...prev, [key]: false })), 2000)
    } catch {
      // clipboard not available
    }
  }, [])

  const handleCopyFullReport = useCallback(async () => {
    const fullReport = sections
      .filter((s) => s.content)
      .map((s) => `${s.title.toUpperCase()}\n${"=".repeat(s.title.length)}\n\n${s.content}`)
      .join("\n\n---\n\n")
    await handleCopy("full", fullReport)
  }, [sections, handleCopy])

  const toggleTier = useCallback((tier: string) => {
    setOpenTiers((prev) => ({ ...prev, [tier]: !prev[tier] }))
  }, [])

  // Clear sessionStorage on "start over"
  const handleStartOver = useCallback(() => {
    sessionStorage.removeItem("salary_negotiator")
  }, [])

  // Don't render until data is loaded
  if (!formData || !scoreResult) {
    return (
      <SoukShell>
        <div style={{
          position: "fixed", inset: 0, zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
        }} role="status">
          <p style={{
            fontFamily: "var(--font-cinzel), serif", fontSize: 13, letterSpacing: ".14em",
            textTransform: "uppercase", color: "var(--souk-gold)",
            animation: "souk-lpulse 1.6s ease-in-out infinite",
          }}>
            Consulting the scales
          </p>
        </div>
      </SoukShell>
    )
  }

  const hatHook = getHatHook(scoreResult.band)
  const verdictQuote = getVerdict(scoreResult.band)

  // Determine streaming progress
  const currentStreamSection = !streamDone && !streamError
    ? sections.find((s) => s.status === "streaming")?.id ?? sections.find((s) => s.status === "skeleton")?.id
    : null
  const streamProgressText = currentStreamSection ? SECTION_PROGRESS[currentStreamSection] : null

  // Build score explanation
  const scoreExplanation = buildScoreExplanation(formData, scoreResult)

  // Market position as percentage (0 = at floor, 100 = at ceiling)
  const range = scoreResult.marketHigh - scoreResult.marketLow
  const positionPct = range > 0
    ? Math.max(0, Math.min(100, ((formData.salary - scoreResult.marketLow) / range) * 100))
    : 50

  return (
    <SoukShell>
      {/* Main content */}
      <div style={{
        position: "relative", zIndex: 10,
        padding: "90px 20px 80px",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <div style={{ maxWidth: 500, width: "100%" }}>

          <Ornament text="&#10022; SSSALEM'S VERDICT &#10022;" />

          {/* ── Score Card ── */}
          <div
            ref={scoreCardRef}
            tabIndex={-1}
            aria-label={`Negotiation score: ${scoreResult.score} out of 100. ${scoreResult.bandLabel}.`}
            style={{
              background: "linear-gradient(160deg, #1A0F06, #0D0804)",
              border: "1px solid rgba(212,168,67,0.25)", borderRadius: 16,
              overflow: "hidden", marginBottom: 16,
              boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,168,67,0.08)",
              animation: "souk-fadeSlideIn 0.6s ease-out both",
              outline: "none",
            }}
          >
            <div style={{
              padding: "28px 24px 20px", textAlign: "center",
              borderBottom: "1px solid rgba(212,168,67,0.12)",
            }}>
              <div style={{
                fontFamily: "var(--font-cinzel), serif", fontSize: 9, letterSpacing: ".25em",
                textTransform: "uppercase", color: "var(--souk-gold)", opacity: 0.65, marginBottom: 18,
              }}>
                The scales have spoken
              </div>
              <div style={{
                fontFamily: "var(--font-cinzel), serif", fontSize: 96, fontWeight: 900,
                lineHeight: 0.9, color: scoreResult.bandColor,
                animation: "souk-scorepop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both",
              }}>
                {scoreResult.score}
              </div>
              <div style={{
                fontFamily: "var(--font-cinzel), serif", fontSize: 22,
                color: "var(--souk-dim)", fontWeight: 400,
              }}>
                /100
              </div>
              <div style={{
                fontFamily: "var(--font-cinzel), serif", fontSize: 12, fontWeight: 700,
                letterSpacing: ".18em", textTransform: "uppercase",
                margin: "12px 0 10px", color: scoreResult.bandColor,
              }}>
                {scoreResult.bandLabel}
              </div>
              <p style={{
                fontSize: 15, fontStyle: "italic", color: "var(--souk-cream2)",
                lineHeight: 1.65, maxWidth: 340, margin: "0 auto",
              }}>
                &#8220;{verdictQuote}&#8221;
              </p>
            </div>

            {/* Score explanation */}
            <div style={{
              padding: "14px 20px",
              borderBottom: "1px solid rgba(212,168,67,0.1)",
              fontSize: 13, color: "var(--souk-muted)", lineHeight: 1.65,
              fontStyle: "italic",
            }}>
              {scoreExplanation}
            </div>

            {/* Market position bar */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(212,168,67,0.1)" }}>
              <div style={{
                fontFamily: "var(--font-cinzel), serif", fontSize: 9, letterSpacing: ".15em",
                textTransform: "uppercase", color: "var(--souk-dim)", marginBottom: 10,
              }}>
                Where your offer sits
              </div>
              <div style={{
                position: "relative", height: 6, borderRadius: 3,
                background: "rgba(212,168,67,0.12)",
              }}>
                {/* Market range highlight */}
                <div style={{
                  position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
                  borderRadius: 3,
                  background: `linear-gradient(to right, ${scoreResult.bandColor}33, ${scoreResult.bandColor}11)`,
                }} />
                {/* Offer position marker */}
                <div style={{
                  position: "absolute",
                  top: -5,
                  left: `${Math.max(2, Math.min(98, positionPct))}%`,
                  transform: "translateX(-50%)",
                  width: 16, height: 16, borderRadius: "50%",
                  background: scoreResult.bandColor,
                  border: "2px solid var(--souk-bg)",
                  boxShadow: `0 0 12px ${scoreResult.bandColor}80`,
                  transition: "left 0.6s ease-out",
                }} />
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between", marginTop: 8,
                fontSize: 10, color: "var(--souk-dim)",
              }}>
                <span>&pound;{scoreResult.marketLow.toLocaleString("en-GB")}</span>
                <span style={{ color: scoreResult.bandColor, fontWeight: 600 }}>
                  You: &pound;{formData.salary.toLocaleString("en-GB")}
                </span>
                <span>&pound;{scoreResult.marketHigh.toLocaleString("en-GB")}</span>
              </div>
            </div>

            {/* Score stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <ScoreStat label="Your offer" value={`\u00A3${formData.salary.toLocaleString("en-GB")}`} borders="rb" />
              <ScoreStat label="Market range" value={`\u00A3${scoreResult.marketLow.toLocaleString("en-GB")} \u2013 \u00A3${scoreResult.marketHigh.toLocaleString("en-GB")}`} borders="b" />
              <ScoreStat
                label="Chance of success"
                value={scoreResult.chance}
                color={scoreResult.bandColor}
                borders="r"
              />
              <ScoreStat
                label="Potential uplift"
                value={`\u00A3${scoreResult.upliftLow.toLocaleString("en-GB")} \u2013 \u00A3${scoreResult.upliftHigh.toLocaleString("en-GB")}`}
                color="#22c55e"
                borders=""
              />
            </div>
          </div>

          {/* ── Error State ── */}
          {streamError && (
            <ErrorCard type={streamError} onRetry={handleRetry} />
          )}

          {/* ── Streaming progress (sticky) ── */}
          {!streamError && !streamDone && streamProgressText && (
            <div style={{
              position: "sticky", top: 0, zIndex: 30,
              textAlign: "center", padding: "10px 0", marginBottom: 8,
              background: "linear-gradient(180deg, var(--souk-bg) 60%, transparent)",
            }}>
              <span style={{
                fontFamily: "var(--font-cinzel), serif", fontSize: 11,
                letterSpacing: ".12em", textTransform: "uppercase",
                color: "var(--souk-gold)",
                animation: "souk-lpulse 1.6s ease-in-out infinite",
              }}>
                {streamProgressText}...
              </span>
            </div>
          )}

          {/* ── Playbook Sections ── */}
          {!streamError && sections.map((section, i) => {
            const def = SECTION_DEFS[i]

            // Skeleton state
            if (section.status === "skeleton" && !streamDone) {
              return (
                <div key={section.id} style={sectionCardStyle}>
                  <SectionEyebrow text={def.eyebrow} />
                  <SectionTitle text={def.title} />
                  {[85, 72, 90, 65].map((w, j) => (
                    <div key={j} style={{
                      height: 10, borderRadius: 4,
                      background: "rgba(212,168,67,0.1)", width: `${w}%`,
                      marginBottom: 8,
                      animation: `souk-pulse 1.5s ease-in-out infinite ${j * 0.15}s`,
                    }} />
                  ))}
                </div>
              )
            }

            if (!section.content && section.status === "skeleton") return null

            // ── Email+Script tabs ──
            if (section.id === "email") {
              const emailSection = sections.find((s) => s.id === "email")
              const scriptSection = sections.find((s) => s.id === "script")
              if (!emailSection?.content && !scriptSection?.content && section.status === "skeleton") return null

              return (
                <div key={section.id} style={{ ...sectionCardStyle, animation: "souk-secin 0.4s ease both" }}>
                  <SectionEyebrow text="The message" />
                  <SectionTitle text="Ready to send" />

                  <div style={{
                    display: "flex", gap: 0, marginTop: 16, marginBottom: 16,
                    border: "1px solid rgba(212,168,67,0.2)", borderRadius: 8, overflow: "hidden",
                  }} role="tablist" aria-label="Message format">
                    {(["email", "verbal"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="souk-tab"
                        style={{
                          flex: 1, padding: "11px 9px", minHeight: 44,
                          background: activeTab === tab ? "rgba(245,166,35,0.15)" : "transparent",
                          border: "none", fontFamily: "var(--font-cinzel), serif",
                          fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase",
                          color: activeTab === tab ? "var(--souk-amber)" : "var(--souk-dim)",
                          cursor: "pointer", transition: "all 0.15s",
                        }}
                        aria-selected={activeTab === tab}
                        role="tab"
                        aria-controls="message-tabpanel"
                      >
                        {tab === "email" ? "Email" : "Verbal"}
                      </button>
                    ))}
                  </div>

                  <div id="message-tabpanel" role="tabpanel" aria-label={activeTab === "email" ? "Email content" : "Verbal script content"} style={scriptBodyStyle}>
                    {activeTab === "email"
                      ? (emailSection?.content || "Awaiting the scroll...")
                      : (scriptSection?.content || "Awaiting the spoken word...")}
                  </div>

                  <CopyButton
                    copied={copied[activeTab]}
                    onClick={() => {
                      const text = activeTab === "email" ? emailSection?.content : scriptSection?.content
                      if (text) handleCopy(activeTab, text)
                    }}
                  />
                </div>
              )
            }

            if (section.id === "script") return null

            // ── Standard section ──
            return (
              <div key={section.id} style={{ ...sectionCardStyle, animation: "souk-secin 0.4s ease both" }}>
                <SectionEyebrow text={def.eyebrow} />
                <SectionTitle text={def.title} />

                {section.id === "negotiable" && section.content ? (
                  <NegotiableContent content={section.content} openTiers={openTiers} toggleTier={toggleTier} />
                ) : (
                  <div style={sectionBodyStyle}>
                    {section.content}
                  </div>
                )}

                {/* Per-section copy button */}
                {section.status === "complete" && section.content && (
                  <CopyButton
                    copied={copied[section.id]}
                    onClick={() => handleCopy(section.id, section.content)}
                  />
                )}
              </div>
            )
          })}

          {/* ── Copy full report ── */}
          {streamDone && !streamError && (
            <button
              onClick={handleCopyFullReport}
              className="souk-copy-btn"
              style={{
                width: "100%", padding: "14px 13px", minHeight: 44, marginBottom: 12,
                background: copied.full ? "rgba(34,197,94,0.15)" : "rgba(245,166,35,0.15)",
                border: `1px solid ${copied.full ? "rgba(34,197,94,0.3)" : "rgba(245,166,35,0.3)"}`,
                borderRadius: 8, fontFamily: "var(--font-cinzel), serif",
                fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase",
                color: copied.full ? "#22c55e" : "var(--souk-amber)",
                cursor: "pointer", transition: "all 0.15s",
                animation: "souk-secin 0.4s ease both",
              }}
            >
              {copied.full ? "\u2713 Copied full report" : "Copy full report \u2192"}
            </button>
          )}

          {/* ── Start Over ── */}
          <Link
            href="/apps/salary"
            onClick={handleStartOver}
            className="souk-redo"
            style={{
              display: "block", width: "100%", padding: "14px 13px", minHeight: 44,
              marginTop: 4, marginBottom: 16,
              background: "transparent",
              border: "1.5px solid rgba(212,168,67,0.2)", borderRadius: 8,
              color: "var(--souk-dim)", fontFamily: "var(--font-cinzel), serif",
              fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase",
              textAlign: "center", textDecoration: "none",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            &#8617; Start over with a new offer
          </Link>

          {/* ── Hat Section (after Start Over, not before) ── */}
          <div style={{
            background: "linear-gradient(135deg, rgba(58,188,189,0.1), rgba(26,113,114,0.08))",
            border: "1px solid rgba(58,188,189,0.2)", borderRadius: 14,
            padding: 20, textAlign: "center",
          }}>
            <div style={{ fontSize: 12, color: "var(--souk-dim)", fontStyle: "italic", marginBottom: 10, lineHeight: 1.6 }}>
              &#8220;{hatHook.line}&#8221;
            </div>
            <div style={{
              fontFamily: "var(--font-cinzel), serif", fontSize: 20, fontWeight: 700,
              color: "var(--souk-teal)", marginBottom: 12,
            }}>
              {hatHook.hat}
            </div>
            <a
              href="https://shop.randomorium.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="souk-hat-link"
              style={{
                display: "inline-block", padding: "10px 24px", minHeight: 44,
                background: "var(--souk-teal2)", color: "var(--souk-cream)",
                fontFamily: "var(--font-cinzel), serif", fontSize: 10,
                letterSpacing: ".1em", textTransform: "uppercase",
                borderRadius: 7, textDecoration: "none", transition: "all 0.15s",
                lineHeight: "24px",
              }}
            >
              Visit the Shop &rarr;
            </a>
          </div>

          {/* Bottom padding for fixed footer */}
          <div style={{ height: 60 }} />
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{
        position: "relative", zIndex: 10, textAlign: "center",
        padding: "0 20px 80px", maxWidth: 500, margin: "0 auto",
      }}>
        <p style={{ fontSize: 10, color: "var(--souk-dim)", fontStyle: "italic", lineHeight: 1.6 }}>
          This is negotiation guidance, not financial or legal advice. Market data is indicative and based on UK averages. Sssalem is fictional. Use your judgement.
        </p>
      </div>
    </SoukShell>
  )
}

// ── Score Explanation builder ────────────────────────────────────────────────
function buildScoreExplanation(formData: FormData, score: ScoreResult): string {
  const salary = formData.salary
  const mid = score.marketMid

  if (salary <= score.marketLow) {
    const gap = score.marketLow - salary
    return `Your offer of \u00A3${salary.toLocaleString("en-GB")} is \u00A3${gap.toLocaleString("en-GB")} below the market floor for a ${formData.experience}-level ${formData.sector} role in ${formData.location}. You have a strong case to negotiate.`
  } else if (salary <= mid) {
    return `Your offer of \u00A3${salary.toLocaleString("en-GB")} sits in the lower half of the market range for a ${formData.experience}-level ${formData.sector} role in ${formData.location}. There is room to push higher.`
  } else if (salary <= score.marketHigh) {
    return `Your offer of \u00A3${salary.toLocaleString("en-GB")} is above the midpoint for a ${formData.experience}-level ${formData.sector} role in ${formData.location}. The salary is competitive, but there may be other things to negotiate.`
  } else {
    return `Your offer of \u00A3${salary.toLocaleString("en-GB")} is above the typical ceiling for a ${formData.experience}-level ${formData.sector} role in ${formData.location}. Focus on non-salary benefits.`
  }
}

// ── Score Stat cell ──────────────────────────────────────────────────────────
function ScoreStat({ label, value, color, borders }: {
  label: string; value: string; color?: string; borders: string
}) {
  return (
    <div style={{
      padding: "16px 20px",
      borderRight: borders.includes("r") ? "1px solid rgba(212,168,67,0.1)" : "none",
      borderBottom: borders.includes("b") ? "1px solid rgba(212,168,67,0.1)" : "none",
    }}>
      <div style={{
        fontFamily: "var(--font-cinzel), serif", fontSize: 10, letterSpacing: ".12em",
        textTransform: "uppercase", color: "var(--souk-dim)", marginBottom: 5,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "var(--font-cinzel), serif", fontSize: 15, fontWeight: 700,
        color: color ?? "var(--souk-cream)",
      }}>
        {value}
      </div>
    </div>
  )
}

// ── Section sub-components ───────────────────────────────────────────────────
function SectionEyebrow({ text }: { text: string }) {
  return (
    <div style={{
      fontFamily: "var(--font-cinzel), serif", fontSize: 9, letterSpacing: ".2em",
      textTransform: "uppercase", color: "var(--souk-gold)", opacity: 0.65, marginBottom: 8,
    }}>
      &#10022; {text}
    </div>
  )
}

function SectionTitle({ text }: { text: string }) {
  return (
    <div style={{
      fontFamily: "var(--font-cinzel), serif", fontSize: 18, fontWeight: 700,
      color: "var(--souk-cream)", marginBottom: 4,
    }}>
      {text}
    </div>
  )
}

function CopyButton({ copied, onClick }: { copied?: boolean; onClick: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
      <button
        onClick={onClick}
        className="souk-copy-btn"
        style={{
          padding: "10px 18px", minHeight: 44,
          background: copied ? "rgba(34,197,94,0.2)" : "rgba(245,166,35,0.15)",
          border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : "rgba(245,166,35,0.3)"}`,
          borderRadius: 6, fontFamily: "var(--font-cinzel), serif",
          fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase",
          color: copied ? "#22c55e" : "var(--souk-amber)",
          cursor: "pointer", transition: "all 0.15s",
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        {copied ? "\u2713 Copied" : "\u2398 Copy"}
      </button>
    </div>
  )
}

// ── Error Card ──────────────────────────────────────────────────────────────
function ErrorCard({ type, onRetry }: { type: string; onRetry: () => void }) {
  const messages: Record<string, { title: string; body: string; showRetry: boolean }> = {
    api_key_missing: {
      title: "The scales cannot be read",
      body: "Sssalem's scales are temporarily unavailable. The proprietor is making arrangements behind the curtain. Your score is still valid \u2014 check back soon for the full playbook.",
      showRetry: false,
    },
    api_error: {
      title: "Sssalem's scroll has jammed",
      body: "The merchant is momentarily unavailable. Your score is still valid \u2014 hit retry for the full playbook.",
      showRetry: true,
    },
    rate_limit: {
      title: "The bazaar is busy",
      body: "Too many merchants at the stall. Give it a moment and try again. Your score and data are safe.",
      showRetry: true,
    },
    connection: {
      title: "The caravan route is blocked",
      body: "Could not reach the bazaar. Check your connection and try again. Your score is safe.",
      showRetry: true,
    },
  }

  const msg = messages[type] ?? messages.api_error

  return (
    <div role="alert" style={{
      background: "rgba(26,15,6,0.7)",
      border: "1px solid rgba(194,59,34,0.3)", borderRadius: 14,
      padding: 22, marginBottom: 12,
      animation: "souk-secin 0.4s ease both",
    }}>
      <div style={{
        fontFamily: "var(--font-cinzel), serif", fontSize: 16, fontWeight: 700,
        color: "var(--souk-cream)", marginBottom: 8,
      }}>
        {msg.title}
      </div>
      <div style={{
        fontSize: 14, color: "var(--souk-muted)", lineHeight: 1.7,
        marginBottom: msg.showRetry ? 16 : 0,
      }}>
        {msg.body}
      </div>
      {msg.showRetry && (
        <button
          onClick={onRetry}
          className="souk-cta"
          style={{
            padding: "12px 24px", minHeight: 44,
            background: "linear-gradient(135deg, var(--souk-amber), var(--souk-amber2))",
            border: "none", borderRadius: 8,
            color: "var(--souk-bg)", fontFamily: "var(--font-cinzel), serif",
            fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
            cursor: "pointer", transition: "all 0.15s",
            boxShadow: "0 4px 16px rgba(245,166,35,0.3)",
          }}
        >
          Try again &rarr;
        </button>
      )}
    </div>
  )
}

// ── Negotiable content with tier accordions ──────────────────────────────────
function NegotiableContent({ content, openTiers, toggleTier }: {
  content: string; openTiers: Record<string, boolean>; toggleTier: (tier: string) => void
}) {
  const tiers = parseTiers(content)

  if (tiers.length === 0) {
    return <div style={sectionBodyStyle}>{content}</div>
  }

  return (
    <div style={{ marginTop: 14 }}>
      {tiers.map((tier) => (
        <div key={tier.id} style={{ marginBottom: 14 }}>
          <button
            onClick={() => toggleTier(tier.id)}
            className="souk-tier-head"
            style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              fontFamily: "var(--font-cinzel), serif", fontSize: 10, letterSpacing: ".12em",
              textTransform: "uppercase", color: "var(--souk-dim)",
              marginBottom: 8, cursor: "pointer", minHeight: 44,
              background: "none", border: "none", padding: "4px 0", textAlign: "left",
              transition: "color 0.15s",
            }}
            aria-expanded={openTiers[tier.id] ?? false}
          >
            {tier.icon} {tier.label}
            <span style={{
              fontSize: 14, marginLeft: "auto", transition: "transform 0.2s",
              transform: openTiers[tier.id] ? "rotate(90deg)" : "rotate(0deg)",
            }}>
              &rsaquo;
            </span>
          </button>
          {openTiers[tier.id] && (
            <div>
              {tier.items.map((item, j) => (
                <div key={j} style={{
                  padding: "10px 12px",
                  borderLeft: "2px solid rgba(212,168,67,0.25)",
                  marginBottom: 8,
                }}>
                  <div style={{
                    fontSize: 13, color: "var(--souk-cream2)",
                    lineHeight: 1.65, whiteSpace: "pre-wrap",
                  }}>
                    {item}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Tier parser ──────────────────────────────────────────────────────────────
interface Tier { id: string; icon: string; label: string; items: string[] }

function parseTiers(content: string): Tier[] {
  const tiers: Tier[] = []
  const lines = content.split("\n")

  const tierPatterns = [
    { pattern: /high\s*(probability|value|priority|tier|impact)/i, id: "high", icon: "\uD83D\uDFE1", label: "High probability" },
    { pattern: /medium\s*(probability|value|priority|tier|impact)/i, id: "medium", icon: "\uD83D\uDFE0", label: "Worth pursuing" },
    { pattern: /low\s*(probability|value|priority|tier|impact)/i, id: "low", icon: "\u26AA", label: "Low cost to ask" },
  ]

  let currentTier: Tier | null = null
  let currentItem = ""

  for (const line of lines) {
    const trimmed = line.trim()
    let matched = false
    for (const tp of tierPatterns) {
      if (tp.pattern.test(trimmed)) {
        if (currentTier) {
          if (currentItem.trim()) currentTier.items.push(currentItem.trim())
          tiers.push(currentTier)
        }
        currentTier = { id: tp.id, icon: tp.icon, label: tp.label, items: [] }
        currentItem = ""
        matched = true
        break
      }
    }
    if (matched) continue

    if (currentTier) {
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("\u2022 ")) {
        if (currentItem.trim()) currentTier.items.push(currentItem.trim())
        currentItem = trimmed.replace(/^[-*\u2022]\s*/, "")
      } else if (trimmed === "") {
        if (currentItem.trim()) currentTier.items.push(currentItem.trim())
        currentItem = ""
      } else {
        if (currentItem) currentItem += "\n" + trimmed
        else currentItem = trimmed
      }
    }
  }

  if (currentTier) {
    if (currentItem.trim()) currentTier.items.push(currentItem.trim())
    tiers.push(currentTier)
  }

  return tiers
}

// ── Section Parser ──────────────────────────────────────────────────────────
function parseSections(text: string, isFinal: boolean): PlaybookSection[] {
  return SECTION_DEFS.map((def, idx) => {
    const openTag = `<section id="${def.id}">`
    const openIdx = text.indexOf(openTag)

    if (openIdx === -1) {
      return { id: def.id, title: def.title, content: "", status: "skeleton" as const }
    }

    const contentStart = openIdx + openTag.length

    // Find the correct closing tag by using the next section's open tag as boundary
    const nextSectionIdx = idx < SECTION_DEFS.length - 1
      ? text.indexOf(`<section id="${SECTION_DEFS[idx + 1].id}">`, contentStart)
      : -1

    const searchEnd = nextSectionIdx !== -1 ? nextSectionIdx : text.length
    const closeTag = "</section>"
    const closeIdx = text.indexOf(closeTag, contentStart)

    if (closeIdx === -1 || closeIdx >= searchEnd) {
      const rawContent = text.slice(contentStart, nextSectionIdx !== -1 ? nextSectionIdx : undefined).trim()
      const content = cleanSectionContent(rawContent, def.id)
      return {
        id: def.id, title: def.title, content,
        status: isFinal ? ("complete" as const) : ("streaming" as const),
      }
    }

    const rawContent = text.slice(contentStart, closeIdx).trim()
    const content = cleanSectionContent(rawContent, def.id)
    return { id: def.id, title: def.title, content, status: "complete" as const }
  })
}

function cleanSectionContent(raw: string, sectionId: string): string {
  const titleMap: Record<string, string[]> = {
    counter: ["COUNTER-OFFER", "COUNTER OFFER", "YOUR COUNTER-OFFER", "YOUR NUMBER"],
    negotiable: ["WHAT'S NEGOTIABLE", "WHATS NEGOTIABLE", "WHAT ELSE IS ON THE TABLE"],
    email: ["THE EMAIL", "READY TO SEND", "THE MESSAGE"],
    script: ["VERBAL SCRIPT", "THE SPOKEN WORD"],
    fallback: ["IF THEY SAY NO", "SSSALEM'S FALLBACK"],
  }

  let cleaned = raw
  const titles = titleMap[sectionId] ?? []
  for (const title of titles) {
    if (cleaned.toUpperCase().startsWith(title)) {
      cleaned = cleaned.slice(title.length).replace(/^[\s\n:]+/, "")
    }
  }

  return cleaned.trim()
}

// ── Shared styles ────────────────────────────────────────────────────────────
const sectionCardStyle: React.CSSProperties = {
  background: "rgba(26,15,6,0.7)",
  border: "1px solid rgba(212,168,67,0.15)",
  borderRadius: 14, padding: 22, marginBottom: 12,
}

const sectionBodyStyle: React.CSSProperties = {
  fontSize: 14, color: "var(--souk-muted)", lineHeight: 1.75,
  marginTop: 14, whiteSpace: "pre-wrap",
}

const scriptBodyStyle: React.CSSProperties = {
  background: "rgba(12,8,4,0.6)", borderRadius: 8, padding: 16,
  fontSize: 13, color: "var(--souk-cream2)", lineHeight: 1.8,
  fontStyle: "italic", whiteSpace: "pre-wrap",
}
