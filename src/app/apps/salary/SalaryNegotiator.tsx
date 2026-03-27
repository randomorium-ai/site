"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { FormData, ExperienceLevel } from "@/lib/salary/types"
import { parseSalary } from "@/lib/salary/parseSalary"
import { calculateScore } from "@/lib/salary/scoring"
import { buildUserPrompt } from "@/lib/salary/prompts"
import { SECTOR_OPTIONS, LOCATIONS, SITUATIONS, EXPERIENCE_LEVELS } from "@/lib/salary/marketData"
import {
  SoukShell,
  SssalemSVG,
  LoadingScalesSVG,
  ProgressDots,
  soukInputStyle,
} from "@/lib/salary/souk-theme"

const TOTAL_STEPS = 4

// ── Component ────────────────────────────────────────────────────────────────
export default function SalaryNegotiator() {
  const router = useRouter()
  const [step, setStep] = useState(0) // 0=landing, 1-4=form steps, 5=loading
  const [transitioning, setTransitioning] = useState(false)

  // Form state
  const [offerText, setOfferText] = useState("")
  const [manualSalary, setManualSalary] = useState("")
  const [sector, setSector] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [location, setLocation] = useState("")
  const [experience, setExperience] = useState<ExperienceLevel | "">("")
  const [situation, setSituation] = useState("")
  const [hasDeadline, setHasDeadline] = useState(false)
  const [deadline, setDeadline] = useState("")

  // Focus ref for step content
  const stepRef = useRef<HTMLDivElement>(null)

  // Parse salary from offer text
  const detectedSalary = useMemo(() => parseSalary(offerText), [offerText])
  const salary = detectedSalary ?? (manualSalary ? parseInt(manualSalary, 10) || null : null)

  // Focus management on step change
  useEffect(() => {
    if (step > 0 && step <= TOTAL_STEPS && !transitioning) {
      const timer = setTimeout(() => {
        const el = stepRef.current?.querySelector("textarea, select, input, button[class*='chip'], button[class*='sit']") as HTMLElement
        el?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [step, transitioning])

  // Step navigation with transition
  const goToStep = useCallback((n: number) => {
    setTransitioning(true)
    setTimeout(() => {
      setStep(n)
      setTransitioning(false)
    }, 400)
  }, [])

  // Validation per step — salary validated at step 1, not at submit
  const canContinue = useMemo(() => {
    switch (step) {
      case 1: return offerText.trim().length > 0 && salary !== null && salary >= 1000
      case 2: return sector !== "" && jobTitle.trim().length > 0
      case 3: return location !== "" && experience !== ""
      case 4: return situation !== ""
      default: return true
    }
  }, [step, offerText, salary, sector, jobTitle, location, experience, situation])

  // Handle Enter key to advance steps (including submit on final step)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && step >= 1 && step <= TOTAL_STEPS && canContinue) {
      if ((e.target as HTMLElement).tagName === "TEXTAREA") return
      e.preventDefault()
      if (step === TOTAL_STEPS) {
        handleSubmit()
      } else {
        goToStep(step + 1)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, canContinue, goToStep])

  // Submit analysis
  const handleSubmit = useCallback(() => {
    if (!experience || !salary || salary < 1000) return

    goToStep(TOTAL_STEPS + 1) // loading screen

    const formData: FormData = {
      offerText,
      salary,
      sector,
      jobTitle,
      location,
      experience,
      situation,
      hasDeadline,
      deadline,
    }

    const scoreResult = calculateScore(salary, sector, location, experience, situation)
    const userPrompt = buildUserPrompt(formData, scoreResult)

    sessionStorage.setItem(
      "salary_negotiator",
      JSON.stringify({ formData, scoreResult, userPrompt }),
    )

    setTimeout(() => {
      router.push("/apps/salary/result")
    }, 2200)
  }, [offerText, salary, sector, jobTitle, location, experience, situation, hasDeadline, deadline, goToStep, router])

  return (
    <SoukShell>
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 10,
          display: "flex", flexDirection: "column",
          alignItems: "center",
          justifyContent: step === 0 ? "flex-start" : "center",
          padding: 20,
          paddingTop: step === 0 ? 90 : 20,
          paddingBottom: 60,
          overflowY: "auto",
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "translateY(-18px)" : "translateY(0)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        {step === 0 && <LandingScreen onStart={() => goToStep(1)} />}
        {step >= 1 && step <= TOTAL_STEPS && (
          <div ref={stepRef} onKeyDown={handleKeyDown} style={{
            maxWidth: 480, width: "100%",
            display: "flex", flexDirection: "column",
            animation: "souk-fadeSlideIn 0.45s ease-out both",
          }}>
            <ProgressDots current={step} total={TOTAL_STEPS} />

            {/* ── Step 1: Offer Text ── */}
            {step === 1 && (
              <StepContent
                title={<>&#8220;What have they<br />offered you?&#8221;</>}
                aside="Paste the offer letter, the email, or just describe the numbers. Sssalem needs to see a salary before the scales can move."
              >
                <label htmlFor="offer-text" style={labelStyle}>Your offer</label>
                <textarea
                  id="offer-text"
                  value={offerText}
                  onChange={(e) => setOfferText(e.target.value)}
                  placeholder="e.g. Base salary £52,000, 10% annual bonus, 25 days holiday, private healthcare, 5% pension match, hybrid working 3 days in office..."
                  rows={6}
                  className="souk-input"
                  style={{ ...soukInputStyle, minHeight: 130, resize: "vertical" as const }}
                />
                {detectedSalary ? (
                  <div style={{
                    marginTop: 8, padding: "8px 12px",
                    background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
                    borderRadius: 8, display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{ color: "#22c55e", fontSize: 14 }}>&#10003;</span>
                    <span style={{ fontSize: 13, color: "#22c55e" }}>
                      Base salary detected: <strong>£{detectedSalary.toLocaleString("en-GB")}</strong>
                    </span>
                  </div>
                ) : offerText.trim().length > 10 ? (
                  <div style={{ marginTop: 10 }}>
                    <label htmlFor="manual-salary" style={{ fontSize: 12, color: "var(--souk-muted)", fontStyle: "italic", marginBottom: 6, display: "block" }}>
                      Sssalem cannot find a number. What is the base salary?
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18, color: "var(--souk-dim)" }}>&pound;</span>
                      <input
                        id="manual-salary"
                        type="number"
                        value={manualSalary}
                        onChange={(e) => setManualSalary(e.target.value)}
                        placeholder="e.g. 45000"
                        className="souk-input"
                        style={{ ...soukInputStyle, flex: 1 }}
                      />
                    </div>
                    {manualSalary && salary && salary >= 1000 && (
                      <div style={{ marginTop: 6, fontSize: 12, color: "#22c55e" }}>
                        &#10003; £{salary.toLocaleString("en-GB")}
                      </div>
                    )}
                  </div>
                ) : null}
              </StepContent>
            )}

            {/* ── Step 2: Sector + Job Title ── */}
            {step === 2 && (
              <StepContent
                title={<>&#8220;What is your<br />trade?&#8221;</>}
                aside="Every souk has its own going rate. Sssalem needs to know your market."
              >
                <label htmlFor="sector-select" style={labelStyle}>Your sector</label>
                <select
                  id="sector-select"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="souk-input"
                  style={{
                    ...soukInputStyle,
                    backgroundImage: selectArrowSvg,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 14px center",
                    paddingRight: 40,
                    cursor: "pointer",
                    WebkitAppearance: "none",
                    appearance: "none" as never,
                  }}
                >
                  <option value="">Select your sector</option>
                  {SECTOR_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div style={{ height: 14 }} />
                <label htmlFor="job-title" style={labelStyle}>Your title in this trade</label>
                <input
                  id="job-title"
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Product Manager"
                  className="souk-input"
                  style={soukInputStyle}
                />
              </StepContent>
            )}

            {/* ── Step 3: Location + Experience (combined) ── */}
            {step === 3 && (
              <StepContent
                title={<>&#8220;Tell Sssalem<br />about yourself&#8221;</>}
                aside="Where you work and how long you have been at it — these are the scales' most important weights."
              >
                <label htmlFor="location-select" style={labelStyle}>Your region</label>
                <select
                  id="location-select"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="souk-input"
                  style={{
                    ...soukInputStyle,
                    backgroundImage: selectArrowSvg,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 14px center",
                    paddingRight: 40,
                    cursor: "pointer",
                    WebkitAppearance: "none",
                    appearance: "none" as never,
                  }}
                >
                  <option value="">Select your region</option>
                  {LOCATIONS.map((l) => (
                    <option key={l.label} value={l.label}>{l.label}</option>
                  ))}
                </select>

                <div style={{ height: 20 }} />

                <div style={labelStyle}>Your experience</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }} role="radiogroup" aria-label="Experience level">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      role="radio"
                      aria-checked={experience === level.id}
                      onClick={() => setExperience(level.id)}
                      className="souk-chip"
                      style={{
                        padding: "13px 18px",
                        minHeight: 44,
                        border: `1.5px solid ${experience === level.id ? "var(--souk-amber)" : "rgba(212,168,67,0.25)"}`,
                        borderRadius: 8,
                        fontFamily: "var(--font-cinzel), serif",
                        fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase",
                        color: experience === level.id ? "var(--souk-amber)" : "var(--souk-muted)",
                        background: experience === level.id ? "rgba(245,166,35,0.18)" : "rgba(26,15,6,0.6)",
                        cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
                        boxShadow: experience === level.id ? "0 0 14px rgba(245,166,35,0.2)" : "none",
                      }}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </StepContent>
            )}

            {/* ── Step 4: Situation + Deadline + Submit ── */}
            {step === 4 && (
              <StepContent
                title={<>&#8220;How did you come<br />to stand before<br />my stall?&#8221;</>}
                aside="The circumstances change everything. Sssalem must know the full picture before he reads the scales."
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 4 }} role="radiogroup" aria-label="Situation">
                  {SITUATIONS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={situation === s.id}
                      onClick={() => setSituation(s.id)}
                      className="souk-sit-card"
                      style={{
                        padding: "15px 14px",
                        minHeight: 44,
                        border: `1.5px solid ${situation === s.id ? "var(--souk-amber)" : "rgba(212,168,67,0.2)"}`,
                        borderRadius: 10,
                        background: situation === s.id ? "rgba(245,166,35,0.12)" : "rgba(26,15,6,0.6)",
                        cursor: "pointer", transition: "all 0.15s",
                        display: "flex", alignItems: "flex-start", gap: 10, textAlign: "left",
                        boxShadow: situation === s.id ? "0 0 18px rgba(245,166,35,0.15)" : "none",
                      }}
                    >
                      <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
                      <div>
                        <div style={{
                          fontFamily: "var(--font-cinzel), serif", fontSize: 11, fontWeight: 600,
                          letterSpacing: ".06em", textTransform: "uppercase",
                          color: situation === s.id ? "var(--souk-amber)" : "var(--souk-cream2)",
                          lineHeight: 1.3,
                        }}>
                          {s.label}
                        </div>
                        <div style={{
                          fontSize: 10, color: "var(--souk-dim)", marginTop: 3,
                          fontStyle: "italic", fontFamily: "var(--font-lora), serif",
                        }}>
                          {s.subtitle}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Deadline toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={hasDeadline}
                  aria-label="I have a deadline to respond"
                  onClick={() => setHasDeadline(!hasDeadline)}
                  className="souk-toggle"
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    marginTop: 16, padding: "12px 16px", width: "100%",
                    minHeight: 44,
                    border: "1.5px solid rgba(212,168,67,0.15)",
                    borderRadius: 8, background: "rgba(26,15,6,0.4)",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <div style={{
                    width: 42, height: 24, borderRadius: 12, flexShrink: 0,
                    background: hasDeadline ? "var(--souk-amber2)" : "rgba(212,168,67,0.15)",
                    position: "relative", transition: "background 0.2s",
                  }}>
                    <div style={{
                      position: "absolute", top: 3, left: hasDeadline ? 21 : 3,
                      width: 18, height: 18, borderRadius: "50%",
                      background: "var(--souk-cream2)", transition: "left 0.2s",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    }} />
                  </div>
                  <span style={{ fontSize: 13, color: "var(--souk-muted)", fontStyle: "italic" }}>
                    They are pressing me for an answer
                  </span>
                </button>
                {hasDeadline && (
                  <div style={{ marginTop: 10 }}>
                    <label htmlFor="deadline-date" className="sr-only">Response deadline</label>
                    <input
                      id="deadline-date"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="souk-input"
                      style={{ ...soukInputStyle, marginTop: 8 }}
                    />
                  </div>
                )}
              </StepContent>
            )}

            {/* Nav buttons */}
            <div style={{ display: "flex", gap: 9, marginTop: 24 }}>
              <button
                onClick={() => goToStep(step - 1)}
                className="souk-btn-back"
                style={{
                  padding: "14px 20px", minHeight: 44, background: "transparent",
                  border: "1.5px solid rgba(212,168,67,0.2)", borderRadius: 8,
                  color: "var(--souk-dim)", fontFamily: "var(--font-cinzel), serif",
                  fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                &larr; Back
              </button>
              <button
                onClick={step === TOTAL_STEPS ? handleSubmit : () => goToStep(step + 1)}
                disabled={!canContinue}
                className="souk-btn-next"
                style={{
                  flex: 1, padding: 14, minHeight: 44,
                  background: canContinue ? "linear-gradient(135deg, var(--souk-amber), var(--souk-amber2))" : "rgba(212,168,67,0.15)",
                  border: "none", borderRadius: 8,
                  color: canContinue ? "var(--souk-bg)" : "var(--souk-dim)",
                  fontFamily: "var(--font-cinzel), serif", fontSize: 11, fontWeight: 700,
                  letterSpacing: ".12em", textTransform: "uppercase",
                  cursor: canContinue ? "pointer" : "not-allowed",
                  transition: "all 0.18s",
                  boxShadow: canContinue ? "0 6px 24px rgba(245,166,35,0.3)" : "none",
                  opacity: canContinue ? 1 : 0.35,
                }}
              >
                {step === TOTAL_STEPS ? "Read the Scales" : "Continue"} &rarr;
              </button>
            </div>
          </div>
        )}
        {step === TOTAL_STEPS + 1 && <LoadingScreen />}
      </div>
    </SoukShell>
  )
}

// ── Step Content ──────────────────────────────────────────────────────────────
function StepContent({
  title,
  aside,
  children,
}: {
  title: React.ReactNode
  aside: string
  children: React.ReactNode
}) {
  return (
    <>
      <h2 style={{
        fontFamily: "var(--font-cinzel), serif",
        fontSize: "clamp(22px, 5vw, 32px)", fontWeight: 700,
        color: "var(--souk-cream)", lineHeight: 1.2, marginBottom: 8,
      }}>
        {title}
      </h2>
      <p style={{
        fontSize: 14, fontStyle: "italic",
        color: "var(--souk-muted)", marginBottom: 28, lineHeight: 1.6,
      }}>
        {aside}
      </p>
      {children}
    </>
  )
}

// ── Landing Screen ───────────────────────────────────────────────────────────
function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      maxWidth: 520, width: "100%", textAlign: "center",
      animation: "souk-fadeSlideIn 0.6s ease-out both",
    }}>
      <p style={{
        fontFamily: "var(--font-cinzel), serif", fontSize: 9, letterSpacing: ".28em",
        textTransform: "uppercase", color: "var(--souk-gold)", opacity: 0.7, marginBottom: 28,
      }}>
        &#10022; &nbsp; The Salary Souk &nbsp; &#10022;
      </p>

      {/* Sssalem illustration */}
      <div style={{ position: "relative", width: 200, height: 200, marginBottom: 24 }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: 220, height: 220,
          background: "radial-gradient(ellipse, rgba(245,166,35,0.18) 0%, transparent 70%)",
          borderRadius: "50%", animation: "souk-sglow 3s ease-in-out infinite",
        }} />
        <div dangerouslySetInnerHTML={{ __html: SssalemSVG }} aria-hidden="true" />
      </div>

      <p style={{
        fontFamily: "var(--font-cinzel), serif", fontSize: 9, letterSpacing: ".28em",
        textTransform: "uppercase", color: "var(--souk-gold)", opacity: 0.7, marginBottom: 12,
      }}>
        &#10022; &nbsp; &#10022; &nbsp; &#10022;
      </p>

      <h1 style={{
        fontFamily: "var(--font-cinzel), serif", fontSize: "clamp(28px, 6vw, 42px)", fontWeight: 700,
        color: "var(--souk-cream)", lineHeight: 1.1, marginBottom: 8, letterSpacing: ".01em",
      }}>
        You have been offered<br />a price.
      </h1>

      <p style={{
        fontSize: 16, fontStyle: "italic", color: "var(--souk-muted)",
        lineHeight: 1.7, marginBottom: 6,
      }}>
        Let Sssalem consult the scales.<br />He has haggled in every souk from Fez to London.
      </p>

      <p style={{
        fontFamily: "var(--font-cinzel), serif", fontSize: 10, letterSpacing: ".12em",
        textTransform: "uppercase", color: "var(--souk-gold)", opacity: 0.6, marginBottom: 32,
      }}>
        — Sssalem Al-Rashid, Proprietor
      </p>

      {/* Stats strip */}
      <div style={{
        display: "flex", gap: 0, marginBottom: 36,
        border: "1px solid rgba(212,168,67,0.2)", borderRadius: 10,
        overflow: "hidden", width: "100%",
      }}>
        {[
          { n: "7 in 10", l: "negotiate and get more" },
          { n: "5\u201315%", l: "typical uplift" },
          { n: "2 min", l: "to your verdict" },
        ].map((stat, i) => (
          <div key={i} style={{
            flex: 1, padding: "12px 8px", textAlign: "center",
            borderRight: i < 2 ? "1px solid rgba(212,168,67,0.15)" : "none",
          }}>
            <span style={{
              fontFamily: "var(--font-cinzel), serif", fontSize: 18, fontWeight: 700,
              color: "var(--souk-amber)", display: "block", marginBottom: 2,
            }}>{stat.n}</span>
            <span style={{ fontSize: 10, color: "var(--souk-dim)", letterSpacing: ".05em" }}>{stat.l}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onStart}
        className="souk-cta"
        style={{
          width: "100%", padding: "17px 28px", minHeight: 48,
          background: "linear-gradient(135deg, var(--souk-amber), var(--souk-amber2))",
          color: "var(--souk-bg)", fontFamily: "var(--font-cinzel), serif",
          fontSize: 13, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase",
          border: "none", borderRadius: 10, cursor: "pointer",
          boxShadow: "0 8px 32px rgba(245,166,35,0.35), 0 2px 8px rgba(245,166,35,0.2)",
          transition: "all 0.2s",
        }}
      >
        Approach the Scales &rarr;
      </button>

      <p style={{
        marginTop: 14, fontSize: 11, color: "var(--souk-dim)",
        fontStyle: "italic", letterSpacing: ".03em",
      }}>
        Free. No account. UK salaries only.
      </p>
    </div>
  )
}

// ── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 28,
      animation: "souk-fadeSlideIn 0.45s ease-out both",
    }} role="status" aria-label="Calculating your negotiation score">
      <div
        style={{ animation: "souk-scalesway 1.4s ease-in-out infinite" }}
        dangerouslySetInnerHTML={{ __html: LoadingScalesSVG }}
        aria-hidden="true"
      />
      <div style={{
        fontFamily: "var(--font-cinzel), serif", fontSize: 13, letterSpacing: ".14em",
        textTransform: "uppercase", color: "var(--souk-gold)",
        animation: "souk-lpulse 1.6s ease-in-out infinite",
      }}>
        Consulting the scales
      </div>
      <div style={{
        fontSize: 13, fontStyle: "italic", color: "var(--souk-dim)",
        textAlign: "center", maxWidth: 280, lineHeight: 1.7,
        animation: "souk-lpulse 2.2s ease-in-out 0.4s infinite",
      }}>
        &#8220;Patience, friend. The market does not reveal itself in haste.&#8221;
      </div>
    </div>
  )
}

// ── Shared styles ────────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-cinzel), serif", fontSize: 10, letterSpacing: ".12em",
  textTransform: "uppercase", color: "var(--souk-dim)",
  display: "block", marginBottom: 8,
}

const selectArrowSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23D4A843' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`
