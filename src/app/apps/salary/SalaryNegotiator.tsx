"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { FormData, ExperienceLevel } from "@/lib/salary/types"
import { parseSalary } from "@/lib/salary/parseSalary"
import { calculateScore } from "@/lib/salary/scoring"
import { buildUserPrompt } from "@/lib/salary/prompts"
import { SECTOR_OPTIONS, LOCATIONS, SITUATIONS, EXPERIENCE_LEVELS } from "@/lib/salary/marketData"

// ── Palette (boardroom dark + professional light) ───────────────────────────
const C = {
  // Intro (dark boardroom)
  introBg: "#0a0a0f",
  cream: "#F0E8D5",
  gold: "#c8a84e",
  goldDark: "#a88a3a",
  muted: "rgba(255, 255, 255, 0.38)",
  introBorder: "rgba(255, 255, 255, 0.08)",
  // Form (light, professional)
  bg: "#FDFBF7",
  surface: "#f8f7f4",
  text: "#1a1a2e",
  textMuted: "#6b7280",
  border: "#e5e5e5",
  accent: "#1a1a2e",
  accentHover: "#2d2d44",
}

// ── Animations ──────────────────────────────────────────────────────────────
const animations = `
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes pointRight {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(4px); }
}
`

// ── Boardroom one-liners for validation errors ──────────────────────────────
const VALIDATION_LINES: Record<string, string> = {
  offerText: "I can't negotiate thin air. Paste the offer.",
  salary: "I need a number. What are they offering you?",
  sector: "What industry? I need to know the market.",
  jobTitle: "What's the job title? Don't be shy.",
  location: "Where's the role? London money isn't Leeds money.",
  experience: "How many years? Be honest.",
  situation: "What's the situation? New offer? Review? Tell me.",
}

// ── Component ───────────────────────────────────────────────────────────────
export default function SalaryNegotiator() {
  const router = useRouter()
  const [phase, setPhase] = useState<"intro" | "form">("intro")
  const [submitting, setSubmitting] = useState(false)

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

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Parse salary from offer text (derived state, no effect needed)
  const detectedSalary = useMemo(() => parseSalary(offerText), [offerText])
  const salary = detectedSalary ?? (manualSalary ? parseInt(manualSalary, 10) || null : null)

  const handleIntroClick = useCallback(() => {
    setPhase("form")
  }, [])

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {}
    if (!offerText.trim()) errs.offerText = VALIDATION_LINES.offerText
    if (!salary || salary < 5000) errs.salary = VALIDATION_LINES.salary
    if (!sector) errs.sector = VALIDATION_LINES.sector
    if (!jobTitle.trim()) errs.jobTitle = VALIDATION_LINES.jobTitle
    if (!location) errs.location = VALIDATION_LINES.location
    if (!experience) errs.experience = VALIDATION_LINES.experience
    if (!situation) errs.situation = VALIDATION_LINES.situation
    setErrors(errs)
    return Object.keys(errs).length === 0
  }, [offerText, salary, sector, jobTitle, location, experience, situation])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!validate() || !salary || !experience) return

      setSubmitting(true)

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

      router.push("/apps/salary/result")
    },
    [offerText, salary, sector, jobTitle, location, experience, situation, hasDeadline, deadline, validate, router],
  )

  return (
    <div className="min-h-screen flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: animations }} />

      {phase === "intro" ? (
        <IntroScreen onStart={handleIntroClick} />
      ) : (
        <div style={{ background: C.bg }} className="min-h-screen flex flex-col">
          {/* Nav */}
          <header
            className="px-4 sm:px-6 py-3 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${C.border}` }}
          >
            <Link
              href="/"
              className="text-xs font-mono hover:opacity-70 transition-opacity"
              style={{ color: C.textMuted }}
            >
              randomorium.ai
            </Link>
            <a
              href="https://shop.randomorium.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-full transition-colors"
              style={{ background: C.accent, color: "#fff" }}
            >
              buy a hat
            </a>
          </header>

          <main
            className="flex-1 flex flex-col items-center px-4 py-8 sm:py-12"
            style={{ animation: "fadeIn 600ms ease-out" }}
          >
            <div className="w-full max-w-lg">
              {/* Boardroom header */}
              <div className="mb-8">
                <p className="text-xs font-mono tracking-widest uppercase mb-2" style={{ color: C.textMuted }}>
                  The Boardroom
                </p>
                <h1
                  className="text-xl sm:text-2xl font-bold tracking-tight mb-2"
                  style={{ color: C.text }}
                >
                  Right. Tell me everything.
                </h1>
                <p className="text-sm" style={{ color: C.textMuted }}>
                  I need all of this to build your playbook. Don&apos;t waste my time with half answers.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Q1: Offer text */}
                <Field label="The offer — paste it" error={errors.offerText}>
                  <textarea
                    value={offerText}
                    onChange={(e) => setOfferText(e.target.value)}
                    placeholder="Paste the email, offer letter, or just describe what they've offered you"
                    rows={5}
                    className="w-full rounded-lg px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-offset-1"
                    style={{
                      background: C.surface,
                      border: `1px solid ${errors.offerText ? "#ef4444" : C.border}`,
                      color: C.text,
                      minHeight: "120px",
                      // @ts-expect-error -- CSS custom property for focus ring
                      "--tw-ring-color": C.accent,
                    }}
                  />
                  {detectedSalary ? (
                    <p className="text-xs mt-1.5 font-medium" style={{ color: "#22c55e" }}>
                      Got it: £{detectedSalary.toLocaleString("en-GB")}
                    </p>
                  ) : offerText.trim().length > 10 ? (
                    <div className="mt-2">
                      <p className="text-xs mb-1.5" style={{ color: C.textMuted }}>
                        Can&apos;t find a salary in there. Type it:
                      </p>
                      <input
                        type="number"
                        value={manualSalary}
                        onChange={(e) => setManualSalary(e.target.value)}
                        placeholder="e.g. 45000"
                        className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                        style={{
                          background: C.surface,
                          border: `1px solid ${errors.salary ? "#ef4444" : C.border}`,
                          color: C.text,
                        }}
                      />
                      {errors.salary && (
                        <p className="text-xs mt-1 italic" style={{ color: "#ef4444" }}>
                          {errors.salary}
                        </p>
                      )}
                    </div>
                  ) : null}
                </Field>

                {/* Q2: Sector */}
                <Field label="Sector" error={errors.sector}>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full rounded-lg px-4 py-3 text-sm cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-offset-1"
                    style={{
                      background: C.surface,
                      border: `1px solid ${errors.sector ? "#ef4444" : C.border}`,
                      color: sector ? C.text : C.textMuted,
                    }}
                  >
                    <option value="">Select your sector</option>
                    {SECTOR_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>

                {/* Q3: Job title */}
                <Field label="Job title" error={errors.jobTitle}>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Product Manager"
                    className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                    style={{
                      background: C.surface,
                      border: `1px solid ${errors.jobTitle ? "#ef4444" : C.border}`,
                      color: C.text,
                    }}
                  />
                </Field>

                {/* Q4: Location */}
                <Field label="Location" error={errors.location}>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-lg px-4 py-3 text-sm cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-offset-1"
                    style={{
                      background: C.surface,
                      border: `1px solid ${errors.location ? "#ef4444" : C.border}`,
                      color: location ? C.text : C.textMuted,
                    }}
                  >
                    <option value="">Select your region</option>
                    {LOCATIONS.map((l) => (
                      <option key={l.label} value={l.label}>{l.label}</option>
                    ))}
                  </select>
                </Field>

                {/* Q5: Experience — segmented selector */}
                <Field label="Experience" error={errors.experience}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {EXPERIENCE_LEVELS.map((level) => (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => setExperience(level.id)}
                        className="px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer text-center"
                        style={{
                          background: experience === level.id ? C.accent : C.surface,
                          border: `1px solid ${experience === level.id ? C.accent : errors.experience ? "#ef4444" : C.border}`,
                          color: experience === level.id ? "#fff" : C.text,
                        }}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Q6: Situation — card selector */}
                <Field label="What&apos;s the situation?" error={errors.situation}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SITUATIONS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSituation(s.id)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all cursor-pointer"
                        style={{
                          background: situation === s.id ? C.accent : C.surface,
                          border: `1px solid ${situation === s.id ? C.accent : errors.situation ? "#ef4444" : C.border}`,
                          color: situation === s.id ? "#fff" : C.text,
                        }}
                      >
                        <span className="text-lg">{s.icon}</span>
                        <span className="text-sm">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Deadline toggle */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setHasDeadline(!hasDeadline)}
                      className="w-10 h-6 rounded-full transition-colors relative cursor-pointer"
                      style={{ background: hasDeadline ? C.accent : C.border }}
                    >
                      <div
                        className="w-4 h-4 rounded-full bg-white absolute top-1 transition-all"
                        style={{ left: hasDeadline ? "20px" : "4px" }}
                      />
                    </div>
                    <span className="text-sm" style={{ color: C.text }}>
                      I have a deadline to respond
                    </span>
                  </label>
                  {hasDeadline && (
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="mt-2 w-full rounded-lg px-4 py-2.5 text-sm"
                      style={{
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        color: C.text,
                      }}
                    />
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-xl text-base font-semibold transition-all cursor-pointer"
                  style={{
                    background: submitting ? C.border : C.accent,
                    color: "#fff",
                    minHeight: "56px",
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {submitting ? "Entering the boardroom..." : "Get My Verdict"}
                </button>
              </form>
            </div>
          </main>

          {/* Footer */}
          <footer
            className="px-4 sm:px-6 py-4 text-center"
            style={{ borderTop: `1px solid ${C.border}` }}
          >
            <p className="text-[11px]" style={{ color: C.textMuted }}>
              Your data stays in your browser. We don&apos;t store offers or salaries.
            </p>
          </footer>
        </div>
      )}
    </div>
  )
}

// ── Intro Screen ────────────────────────────────────────────────────────────
function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div
      style={{ background: C.introBg, color: C.cream }}
      className="min-h-screen flex flex-col"
    >
      <header
        className="px-4 sm:px-6 py-3 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${C.introBorder}` }}
      >
        <Link
          href="/"
          className="text-xs font-mono hover:opacity-70 transition-opacity"
          style={{ color: C.muted }}
        >
          randomorium.ai
        </Link>
        <a
          href="https://shop.randomorium.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-3 py-1.5 rounded-full transition-colors"
          style={{ background: C.gold, color: "#000" }}
        >
          buy a hat
        </a>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-16">
        <div
          className="w-full max-w-md text-center"
          style={{ animation: "fadeSlideIn 600ms ease-out" }}
        >
          {/* Boardroom ambiance */}
          <p
            className="text-xs font-mono tracking-widest uppercase mb-6"
            style={{ color: C.muted }}
          >
            The Boardroom
          </p>

          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
            style={{ color: C.cream }}
          >
            Salary Negotiator
          </h1>

          <p
            className="text-base mb-3 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            &ldquo;You accepted their first offer? That&apos;s not negotiating. That&apos;s surrendering.&rdquo;
          </p>

          <p className="text-sm mb-4" style={{ color: C.muted }}>
            Paste your offer. Get a counter-offer, a ready-to-send email,
            a verbal script, and a fallback plan.
          </p>

          <p className="text-xs mb-10 italic" style={{ color: C.muted }}>
            Powered by Lord Sralan&apos;s boardroom wisdom and an unhealthy amount of market data.
          </p>

          <button
            onClick={onStart}
            className="w-full py-4 rounded-xl text-base font-semibold transition-all cursor-pointer"
            style={{
              background: C.gold,
              color: "#000",
              minHeight: "56px",
            }}
          >
            Enter the Boardroom
          </button>
        </div>
      </main>
    </div>
  )
}

// ── Field wrapper ───────────────────────────────────────────────────────────
function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: C.text }}>
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs mt-1 italic" style={{ color: "#ef4444" }}>
          {error}
        </p>
      )}
    </div>
  )
}
