"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { FormData, ScoreResult, PlaybookSection } from "@/lib/salary/types"
import { getHatHook } from "@/lib/salary/scoring"

// ── Palette ─────────────────────────────────────────────────────────────────
const C = {
  bg: "#FDFBF7",
  surface: "#f8f7f4",
  cardBg: "#ffffff",
  text: "#1a1a2e",
  textMuted: "#6b7280",
  border: "#e5e5e5",
  accent: "#1a1a2e",
  gold: "#c8a84e",
  goldLight: "#f5ecd7",
  introBg: "#0a0a0f",
  cream: "#F0E8D5",
  muted: "rgba(255, 255, 255, 0.38)",
}

// ── Lord Sralan verdict lines ───────────────────────────────────────────────
function getVerdict(band: string): { line: string; subline: string } {
  switch (band) {
    case "strong":
      return {
        line: "You're being undersold. Badly.",
        subline: "This isn't a negotiation — it's a correction. You've got serious leverage here.",
      }
    case "good":
      return {
        line: "There's money on the table. Go get it.",
        subline: "Decent position. A good negotiator walks away with more. That's what we're going to do.",
      }
    case "possible":
      return {
        line: "It's not terrible. But it's not right either.",
        subline: "You've got a case to make, but you'll need to make it well. Follow the playbook exactly.",
      }
    case "honest":
      return {
        line: "I'm going to be straight with you.",
        subline: "The numbers are tight. But there's always something to negotiate — if you know what to ask for.",
      }
    default:
      return { line: "Let's have a look.", subline: "" }
  }
}

// ── Section definitions ─────────────────────────────────────────────────────
const SECTION_DEFS = [
  { id: "counter", title: "Your Counter-Offer", icon: "1" },
  { id: "negotiable", title: "What's Negotiable", icon: "2" },
  { id: "email", title: "The Email", icon: "3" },
  { id: "script", title: "Verbal Script", icon: "4" },
  { id: "fallback", title: "If They Say No", icon: "5" },
]

// ── Animations ──────────────────────────────────────────────────────────────
const animations = `
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}
@keyframes typing {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
`

// ── Component ───────────────────────────────────────────────────────────────
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
  const abortRef = useRef<AbortController | null>(null)

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
            setStreamError("api_error")
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

  // Don't render until data is loaded
  if (!formData || !scoreResult) {
    return (
      <div
        style={{ background: C.bg }}
        className="min-h-screen flex items-center justify-center"
      >
        <p className="text-sm" style={{ color: C.textMuted }}>Loading...</p>
      </div>
    )
  }

  const verdict = getVerdict(scoreResult.band)
  const hatHook = getHatHook(scoreResult.band)

  return (
    <div style={{ background: C.bg }} className="min-h-screen flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: animations }} />

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

      <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl">

          {/* ── Score Card ──────────────────────────────────────── */}
          <div
            className="rounded-2xl overflow-hidden mb-8"
            style={{ animation: "fadeSlideIn 600ms ease-out" }}
          >
            {/* Dark header */}
            <div
              className="px-6 sm:px-8 pt-8 pb-6 text-center"
              style={{ background: C.introBg }}
            >
              <p className="text-xs font-mono tracking-widest uppercase mb-5" style={{ color: C.muted }}>
                Lord Sralan&apos;s Verdict
              </p>

              {/* Score */}
              <div className="mb-3">
                <span
                  className="text-7xl sm:text-8xl font-black tabular-nums"
                  style={{ color: scoreResult.bandColor }}
                >
                  {scoreResult.score}
                </span>
                <span className="text-2xl font-light" style={{ color: C.muted }}>
                  /100
                </span>
              </div>

              <p
                className="text-xs font-semibold tracking-widest uppercase mb-4"
                style={{ color: scoreResult.bandColor }}
              >
                {scoreResult.bandLabel}
              </p>

              {/* Verdict line */}
              <p className="text-lg font-semibold mb-1" style={{ color: C.cream }}>
                &ldquo;{verdict.line}&rdquo;
              </p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                {verdict.subline}
              </p>
            </div>

            {/* Stats — light bottom */}
            <div
              className="px-6 sm:px-8 py-5 grid grid-cols-2 gap-4"
              style={{ background: C.goldLight, borderTop: `2px solid ${C.gold}` }}
            >
              <Stat
                label="Your offer"
                value={`\u00A3${formData.salary.toLocaleString("en-GB")}`}
              />
              <Stat
                label="Market range"
                value={`\u00A3${scoreResult.marketLow.toLocaleString("en-GB")} \u2013 \u00A3${scoreResult.marketHigh.toLocaleString("en-GB")}`}
              />
              <Stat
                label={scoreResult.gapLow > 0 ? "Below market by" : "Market position"}
                value={
                  scoreResult.gapLow > 0
                    ? `\u00A3${scoreResult.gapLow.toLocaleString("en-GB")} \u2013 \u00A3${scoreResult.gapHigh.toLocaleString("en-GB")}`
                    : "Within or above range"
                }
                highlight={scoreResult.gapLow > 0}
              />
              <Stat
                label="Typical uplift"
                value={`\u00A3${scoreResult.upliftLow.toLocaleString("en-GB")} \u2013 \u00A3${scoreResult.upliftHigh.toLocaleString("en-GB")}`}
              />
            </div>
          </div>

          {/* ── Error State ─────────────────────────────────────── */}
          {streamError && (
            <ErrorCard type={streamError} onRetry={handleRetry} />
          )}

          {/* ── Playbook Sections ───────────────────────────────── */}
          {!streamError && (
            <div className="space-y-4 mb-8">
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="text-lg font-bold" style={{ color: C.text }}>
                  Your Playbook
                </h2>
                {!streamDone && (
                  <span className="text-xs" style={{ color: C.textMuted }}>
                    Lord Sralan is typing
                    <span style={{ animation: "typing 1s ease-in-out infinite" }}>.</span>
                    <span style={{ animation: "typing 1s ease-in-out infinite 0.2s" }}>.</span>
                    <span style={{ animation: "typing 1s ease-in-out infinite 0.4s" }}>.</span>
                  </span>
                )}
              </div>

              {sections.map((section, i) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  stepNumber={SECTION_DEFS[i].icon}
                  onCopy={
                    (section.id === "email" || section.id === "script") && section.status === "complete"
                      ? () => handleCopy(section.id, section.content)
                      : undefined
                  }
                  copied={copied[section.id] ?? false}
                />
              ))}
            </div>
          )}

          {/* ── Actions ────────────────────────────────────────── */}
          {streamDone && !streamError && (
            <div
              className="space-y-3 mb-8"
              style={{ animation: "fadeSlideIn 400ms ease-out" }}
            >
              <button
                onClick={handleCopyFullReport}
                className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                style={{
                  background: C.accent,
                  color: "#fff",
                  minHeight: "48px",
                }}
              >
                {copied.full ? "Copied to clipboard" : "Copy Full Playbook"}
              </button>
            </div>
          )}

          {/* ── Hat Hook ───────────────────────────────────────── */}
          <div
            className="rounded-xl p-6 mb-6 text-center"
            style={{
              background: C.goldLight,
              border: `1px solid ${C.gold}`,
            }}
          >
            <p className="text-sm mb-1 font-medium" style={{ color: C.text }}>
              &ldquo;{hatHook.line}&rdquo;
            </p>
            <p className="text-xs mb-3" style={{ color: C.textMuted }}>
              &mdash; Lord Sralan
            </p>
            <a
              href="https://shop.randomorium.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              style={{ background: C.accent, color: C.cream }}
            >
              {hatHook.hat} &rarr;
            </a>
          </div>

          {/* ── Start Over ─────────────────────────────────────── */}
          <div className="text-center pb-4">
            <Link
              href="/apps/salary"
              className="text-sm transition-opacity hover:opacity-70"
              style={{ color: C.textMuted }}
            >
              &larr; New negotiation
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="px-4 sm:px-6 py-4 text-center"
        style={{ borderTop: `1px solid ${C.border}` }}
      >
        <p className="text-[11px]" style={{ color: C.textMuted }}>
          This is negotiation guidance, not financial or legal advice. Lord Sralan is fictional. Use your judgement.
        </p>
      </footer>
    </div>
  )
}

// ── Stat ─────────────────────────────────────────────────────────────────────
function Stat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-wide mb-0.5" style={{ color: C.textMuted }}>
        {label}
      </p>
      <p
        className="text-sm font-semibold"
        style={{ color: highlight ? "#dc2626" : C.text }}
      >
        {value}
      </p>
    </div>
  )
}

// ── Error Card ──────────────────────────────────────────────────────────────
function ErrorCard({ type, onRetry }: { type: string; onRetry: () => void }) {
  const messages: Record<string, { title: string; body: string }> = {
    api_error: {
      title: "\"Someone's getting fired for this.\"",
      body: "Lord Sralan's boardroom is temporarily closed. The AI that writes your playbook couldn't be reached. Your score is still valid — hit retry for the full playbook.",
    },
    rate_limit: {
      title: "\"There's a queue. I don't do queues.\"",
      body: "Too many people in the boardroom right now. Give it a minute and try again. Your score and data are still here.",
    },
    connection: {
      title: "\"The line's gone dead.\"",
      body: "Couldn't connect to the server. Check your internet and hit retry. Your score is safe.",
    },
  }

  const msg = messages[type] ?? messages.api_error

  return (
    <div
      className="rounded-xl overflow-hidden mb-8"
      style={{
        border: `1px solid ${C.border}`,
        animation: "fadeSlideIn 400ms ease-out",
      }}
    >
      <div
        className="px-6 py-5"
        style={{ background: C.introBg }}
      >
        <p className="text-base font-semibold mb-2" style={{ color: C.cream }}>
          {msg.title}
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
          {msg.body}
        </p>
      </div>
      <div className="px-6 py-4 flex justify-end" style={{ background: C.surface }}>
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer"
          style={{ background: C.accent, color: "#fff" }}
        >
          Retry
        </button>
      </div>
    </div>
  )
}

// ── Section Card ────────────────────────────────────────────────────────────
function SectionCard({
  section,
  stepNumber,
  onCopy,
  copied,
}: {
  section: PlaybookSection
  stepNumber: string
  onCopy?: () => void
  copied: boolean
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: C.cardBg,
        border: `1px solid ${C.border}`,
        animation: section.status !== "skeleton" ? "fadeSlideIn 400ms ease-out" : undefined,
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-3.5 flex items-center justify-between"
        style={{ borderBottom: section.content ? `1px solid ${C.border}` : undefined }}
      >
        <div className="flex items-center gap-3">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
            style={{
              background: section.status === "complete" ? C.accent : section.status === "streaming" ? C.gold : C.border,
              color: section.status === "skeleton" ? C.textMuted : "#fff",
            }}
          >
            {stepNumber}
          </span>
          <h3 className="text-sm font-semibold" style={{ color: C.text }}>
            {section.title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {section.status === "streaming" && (
            <span
              className="text-[10px] font-mono"
              style={{ color: C.gold }}
            >
              writing...
            </span>
          )}
          {onCopy && (
            <button
              onClick={onCopy}
              className="text-xs px-3 py-1 rounded-full transition-all cursor-pointer font-medium"
              style={{
                background: copied ? "#22c55e" : C.surface,
                color: copied ? "#fff" : C.textMuted,
                border: `1px solid ${copied ? "#22c55e" : C.border}`,
              }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {section.status === "skeleton" ? (
        <div className="px-5 py-5 space-y-2.5">
          {[85, 72, 90, 65, 50].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded"
              style={{
                background: C.border,
                width: `${w}%`,
                animation: `pulse 1.5s ease-in-out infinite ${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="px-5 py-5">
          <div
            className="text-sm leading-relaxed whitespace-pre-line"
            style={{ color: C.text }}
          >
            {section.content}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Section Parser ──────────────────────────────────────────────────────────
function parseSections(text: string, isFinal: boolean): PlaybookSection[] {
  return SECTION_DEFS.map((def) => {
    const openTag = `<section id="${def.id}">`
    const closeTag = `</section>`

    const openIdx = text.indexOf(openTag)
    if (openIdx === -1) {
      return { id: def.id, title: def.title, content: "", status: "skeleton" as const }
    }

    const contentStart = openIdx + openTag.length
    const closeIdx = text.indexOf(closeTag, contentStart)

    if (closeIdx === -1) {
      const rawContent = text.slice(contentStart).trim()
      const content = cleanSectionContent(rawContent, def.id)
      return {
        id: def.id,
        title: def.title,
        content,
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
    counter: ["COUNTER-OFFER", "COUNTER OFFER", "YOUR COUNTER-OFFER"],
    negotiable: ["WHAT'S NEGOTIABLE", "WHATS NEGOTIABLE"],
    email: ["THE EMAIL"],
    script: ["VERBAL SCRIPT"],
    fallback: ["IF THEY SAY NO"],
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
