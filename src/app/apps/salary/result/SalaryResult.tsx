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
  text: "#1a1a2e",
  textMuted: "#6b7280",
  border: "#e5e5e5",
  accent: "#3ABCBD",
  introBg: "#070512",
  cream: "#F0E8D5",
  muted: "rgba(255, 255, 255, 0.38)",
}

// ── Section definitions ─────────────────────────────────────────────────────
const SECTION_DEFS = [
  { id: "counter", title: "Counter-Offer" },
  { id: "negotiable", title: "What's Negotiable" },
  { id: "email", title: "The Email" },
  { id: "script", title: "Verbal Script" },
  { id: "fallback", title: "If They Say No" },
]

// ── Animations ──────────────────────────────────────────────────────────────
const animations = `
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}
`

// ── Component ───────────────────────────────────────────────────────────────
export default function SalaryResult() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData | null>(null)
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  const [userPrompt, setUserPrompt] = useState<string>("")
  const [sections, setSections] = useState<PlaybookSection[]>(
    SECTION_DEFS.map((d) => ({ ...d, content: "", status: "skeleton" as const })),
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

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPrompt])

  const startStreaming = useCallback(
    async (prompt: string, signal: AbortSignal) => {
      setStreamError(null)
      setStreamDone(false)
      setSections(
        SECTION_DEFS.map((d) => ({ ...d, content: "", status: "skeleton" as const })),
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
        setStreamError("Failed to connect. Check your connection and try again.")
        console.error("Fetch error:", err)
        return
      }

      if (!res.ok) {
        try {
          const errData = await res.json()
          if (errData.error === "rate_limit") {
            setStreamError("The bazaar is busy — try again in a moment.")
          } else if (errData.error === "api_key_missing") {
            setStreamError("Sssalem's scroll has jammed. The merchant is unavailable.")
          } else {
            setStreamError("Sssalem's scroll has jammed. Try again.")
          }
        } catch {
          setStreamError("Sssalem's scroll has jammed. Try again.")
        }
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setStreamError("Empty response from the API.")
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
              // Final parse
              setSections(parseSections(fullText, true))
              return
            }

            try {
              const event = JSON.parse(data)
              if (event.error) {
                setStreamError("Sssalem's scroll has jammed. Try again.")
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

        // Stream ended without [DONE]
        setStreamDone(true)
        setSections(parseSections(fullText, true))
      } catch (err) {
        if (signal.aborted) return
        console.error("Stream read error:", err)
        setStreamError("Lost connection to Sssalem. Try again.")
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
        <p className="text-sm" style={{ color: C.textMuted }}>
          Loading...
        </p>
      </div>
    )
  }

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
        <div className="w-full max-w-lg">
          {/* ── Score Card ──────────────────────────────────────── */}
          <div
            className="rounded-xl p-6 sm:p-8 mb-8 text-center"
            style={{
              background: C.introBg,
              animation: "fadeSlideIn 600ms ease-out",
            }}
          >
            <p className="text-xs tracking-widest mb-4 uppercase" style={{ color: C.muted }}>
              Your Negotiation Score
            </p>

            {/* Score number */}
            <div className="mb-2">
              <span
                className="text-6xl sm:text-7xl font-bold tabular-nums"
                style={{ color: scoreResult.bandColor }}
              >
                {scoreResult.score}
              </span>
              <span
                className="text-2xl sm:text-3xl font-light"
                style={{ color: C.muted }}
              >
                {" "}/{" "}100
              </span>
            </div>

            <p
              className="text-sm font-semibold tracking-wide uppercase mb-6"
              style={{ color: scoreResult.bandColor }}
            >
              {scoreResult.bandLabel}
            </p>

            {/* Stats grid */}
            <div
              className="rounded-lg p-4 space-y-3 text-left text-sm"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <StatRow
                label="Your offer"
                value={`\u00A3${formData.salary.toLocaleString("en-GB")}`}
              />
              <StatRow
                label="Market range"
                value={`\u00A3${scoreResult.marketLow.toLocaleString("en-GB")} \u2013 \u00A3${scoreResult.marketHigh.toLocaleString("en-GB")}`}
              />
              {scoreResult.gapLow > 0 || scoreResult.gapHigh > 0 ? (
                <StatRow
                  label="Gap"
                  value={`\u00A3${scoreResult.gapLow.toLocaleString("en-GB")} \u2013 \u00A3${scoreResult.gapHigh.toLocaleString("en-GB")} below market`}
                  valueColor="#f59e0b"
                />
              ) : (
                <StatRow
                  label="Gap"
                  value="Within or above market range"
                  valueColor="#22c55e"
                />
              )}
              <StatRow label="Chance" value={scoreResult.chance} />
              <StatRow
                label="Typical uplift"
                value={`\u00A3${scoreResult.upliftLow.toLocaleString("en-GB")} \u2013 \u00A3${scoreResult.upliftHigh.toLocaleString("en-GB")}`}
              />
            </div>
          </div>

          {/* ── Error State ─────────────────────────────────────── */}
          {streamError && (
            <div
              className="rounded-lg p-5 mb-6 text-center"
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                animation: "fadeSlideIn 400ms ease-out",
              }}
            >
              <p className="text-sm mb-3" style={{ color: "#991b1b" }}>
                {streamError}
              </p>
              <button
                onClick={handleRetry}
                className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer"
                style={{ background: C.accent, color: "#fff" }}
              >
                Try again
              </button>
            </div>
          )}

          {/* ── Playbook Sections ───────────────────────────────── */}
          {!streamError && (
            <div className="space-y-4 mb-8">
              <h2 className="text-lg font-semibold" style={{ color: C.text }}>
                Your Playbook
              </h2>

              {sections.map((section) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  onCopy={
                    (section.id === "email" || section.id === "script") && section.status === "complete"
                      ? () => handleCopy(section.id, extractCopyableContent(section))
                      : undefined
                  }
                  copied={copied[section.id] ?? false}
                />
              ))}
            </div>
          )}

          {/* ── Copy Full Report ───────────────────────────────── */}
          {streamDone && !streamError && (
            <div
              className="mb-6"
              style={{ animation: "fadeSlideIn 400ms ease-out" }}
            >
              <button
                onClick={handleCopyFullReport}
                className="w-full py-3.5 rounded-lg text-sm font-medium transition-all cursor-pointer"
                style={{
                  background: C.accent,
                  color: "#fff",
                  minHeight: "48px",
                }}
              >
                {copied.full ? "Copied!" : "Copy Full Report"}
              </button>
            </div>
          )}

          {/* ── Hat Hook ───────────────────────────────────────── */}
          <div
            className="rounded-lg p-5 mb-6 text-center"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}
          >
            <p className="text-sm italic mb-1" style={{ color: C.text }}>
              {hatHook.line}
            </p>
            <a
              href="https://shop.randomorium.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ background: C.introBg, color: C.cream }}
            >
              {hatHook.hat} &rarr;
            </a>
          </div>

          {/* ── Start Over ─────────────────────────────────────── */}
          <div className="text-center">
            <Link
              href="/apps/salary"
              className="text-sm transition-opacity hover:opacity-70"
              style={{ color: C.textMuted }}
            >
              &larr; Start over
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
          This is negotiation guidance, not financial or legal advice. Use your judgement.
        </p>
      </footer>
    </div>
  )
}

// ── Stat Row ────────────────────────────────────────────────────────────────
function StatRow({
  label,
  value,
  valueColor,
}: {
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-xs uppercase tracking-wide" style={{ color: C.muted }}>
        {label}
      </span>
      <span
        className="text-sm font-medium"
        style={{ color: valueColor ?? C.cream }}
      >
        {value}
      </span>
    </div>
  )
}

// ── Section Card ────────────────────────────────────────────────────────────
function SectionCard({
  section,
  onCopy,
  copied,
}: {
  section: PlaybookSection
  onCopy?: () => void
  copied: boolean
}) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "#fff",
        border: `1px solid ${C.border}`,
        animation: section.status !== "skeleton" ? "fadeSlideIn 400ms ease-out" : undefined,
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: section.content ? `1px solid ${C.border}` : undefined }}
      >
        <h3 className="text-sm font-semibold" style={{ color: C.text }}>
          {section.title}
        </h3>
        {section.status === "streaming" && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{
              background: C.accent,
              color: "#fff",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          >
            streaming
          </span>
        )}
        {onCopy && (
          <button
            onClick={onCopy}
            className="text-xs px-3 py-1 rounded-full transition-all cursor-pointer"
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

      {/* Content */}
      {section.status === "skeleton" ? (
        <div className="px-4 py-4 space-y-2">
          <div
            className="h-3 rounded"
            style={{ background: C.border, width: "85%", animation: "pulse 1.5s ease-in-out infinite" }}
          />
          <div
            className="h-3 rounded"
            style={{ background: C.border, width: "70%", animation: "pulse 1.5s ease-in-out infinite 0.2s" }}
          />
          <div
            className="h-3 rounded"
            style={{ background: C.border, width: "60%", animation: "pulse 1.5s ease-in-out infinite 0.4s" }}
          />
        </div>
      ) : (
        <div className="px-4 py-4">
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
      // Section hasn't started yet
      return { ...def, content: "", status: "skeleton" as const }
    }

    const contentStart = openIdx + openTag.length

    // Find the closing tag that belongs to this section
    // We need to find the next </section> after the opening tag
    const closeIdx = text.indexOf(closeTag, contentStart)

    if (closeIdx === -1) {
      // Section has started but not closed — streaming
      const rawContent = text.slice(contentStart).trim()
      const content = cleanSectionContent(rawContent, def.id)
      return {
        ...def,
        content,
        status: isFinal ? ("complete" as const) : ("streaming" as const),
      }
    }

    // Section is complete
    const rawContent = text.slice(contentStart, closeIdx).trim()
    const content = cleanSectionContent(rawContent, def.id)
    return { ...def, content, status: "complete" as const }
  })
}

function cleanSectionContent(raw: string, sectionId: string): string {
  // Remove the section title if it appears at the start (e.g. "COUNTER-OFFER\n")
  const titleMap: Record<string, string[]> = {
    counter: ["COUNTER-OFFER", "COUNTER OFFER"],
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

function extractCopyableContent(section: PlaybookSection): string {
  if (section.id === "email") {
    return section.content
  }
  return section.content
}
