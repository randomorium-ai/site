"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { FormData, ScoreResult, PlaybookSection } from "@/lib/salary/types"
import { getHatHook } from "@/lib/salary/scoring"

// ── CSS variables + keyframes ────────────────────────────────────────────────
const globalStyles = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Lora:ital,wght@0,400;0,500;1,400;1,500&display=swap');

:root {
  --bg: #0C0804;
  --bg2: #1A0F06;
  --amber: #F5A623;
  --amber2: #C47D0E;
  --teal: #3ABCBD;
  --teal2: #1A7172;
  --cream: #F0E4C4;
  --cream2: #D4C49A;
  --red: #C23B22;
  --gold: #D4A843;
  --gold2: #A07820;
  --muted: rgba(240,228,196,0.45);
  --dim: rgba(240,228,196,0.22);
  --fd: 'Cinzel', serif;
  --fb: 'Lora', serif;
}

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes scorepop {
  from { transform: scale(0.7); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes secin {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.35; }
}
@keyframes lpulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
@keyframes lsw {
  0%, 100% { transform: rotate(-6deg); }
  50% { transform: rotate(6deg); }
}
`

// ── Arabesque background ─────────────────────────────────────────────────────
const arabesqueBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M40 2 L78 40 L40 78 L2 40 Z' fill='none' stroke='rgba(212,168,67,0.07)' stroke-width='1'/%3E%3Cpath d='M40 14 L66 40 L40 66 L14 40 Z' fill='none' stroke='rgba(212,168,67,0.05)' stroke-width='1'/%3E%3Ccircle cx='40' cy='40' r='6' fill='none' stroke='rgba(212,168,67,0.06)' stroke-width='1'/%3E%3Ccircle cx='2' cy='2' r='2' fill='rgba(212,168,67,0.06)'/%3E%3Ccircle cx='78' cy='2' r='2' fill='rgba(212,168,67,0.06)'/%3E%3Ccircle cx='2' cy='78' r='2' fill='rgba(212,168,67,0.06)'/%3E%3Ccircle cx='78' cy='78' r='2' fill='rgba(212,168,67,0.06)'/%3E%3C/svg%3E")`

// ── Lantern data ─────────────────────────────────────────────────────────────
const LANTERNS = [
  { rope: 20, dur: 2.6, delay: 0, svg: `<svg width="22" height="32" viewBox="0 0 22 32" fill="none"><rect x="3" y="4" width="16" height="22" rx="4" fill="#8A3010" opacity=".9"/><rect x="5" y="7" width="5" height="5" fill="#F5A623" opacity=".8" rx="1"/><rect x="12" y="7" width="5" height="5" fill="#F5A623" opacity=".8" rx="1"/><rect x="5" y="15" width="5" height="5" fill="#F5A623" opacity=".7" rx="1"/><rect x="12" y="15" width="5" height="5" fill="#F5A623" opacity=".7" rx="1"/><rect x="1" y="2" width="20" height="4" fill="#6A2008" rx="2"/><rect x="1" y="24" width="20" height="4" fill="#6A2008" rx="2"/></svg>` },
  { rope: 35, dur: 2.2, delay: 0.55, svg: `<svg width="26" height="38" viewBox="0 0 26 38" fill="none"><rect x="3" y="5" width="20" height="26" rx="5" fill="#1A5A3A" opacity=".9"/><rect x="5" y="9" width="7" height="6" fill="#F5A623" opacity=".8" rx="1"/><rect x="14" y="9" width="7" height="6" fill="#F5A623" opacity=".8" rx="1"/><rect x="5" y="18" width="7" height="6" fill="#F5A623" opacity=".7" rx="1"/><rect x="14" y="18" width="7" height="6" fill="#F5A623" opacity=".65" rx="1"/><rect x="1" y="3" width="24" height="4" fill="#0F3D26" rx="2"/><rect x="1" y="29" width="24" height="5" fill="#0F3D26" rx="2"/></svg>` },
  { rope: 15, dur: 3.0, delay: 0.2, svg: `<svg width="30" height="44" viewBox="0 0 30 44" fill="none"><rect x="3" y="5" width="24" height="32" rx="6" fill="#7A1A5A" opacity=".9"/><rect x="6" y="9" width="8" height="7" fill="#F5A623" opacity=".85" rx="1.5"/><rect x="16" y="9" width="8" height="7" fill="#F5A623" opacity=".85" rx="1.5"/><rect x="6" y="19" width="8" height="7" fill="#F5A623" opacity=".75" rx="1.5"/><rect x="16" y="19" width="8" height="7" fill="#F5A623" opacity=".75" rx="1.5"/><rect x="1" y="3" width="28" height="5" fill="#5A0A3A" rx="2"/><rect x="1" y="35" width="28" height="6" fill="#5A0A3A" rx="2"/></svg>` },
  { rope: 28, dur: 2.4, delay: 0.85, svg: `<svg width="22" height="32" viewBox="0 0 22 32" fill="none"><rect x="3" y="4" width="16" height="22" rx="4" fill="#1A3A7A" opacity=".9"/><rect x="5" y="7" width="5" height="5" fill="#F5C040" opacity=".8" rx="1"/><rect x="12" y="7" width="5" height="5" fill="#F5C040" opacity=".8" rx="1"/><rect x="5" y="15" width="5" height="5" fill="#F5C040" opacity=".7" rx="1"/><rect x="12" y="15" width="5" height="5" fill="#F5C040" opacity=".7" rx="1"/><rect x="1" y="2" width="20" height="4" fill="#0A1E4A" rx="2"/><rect x="1" y="24" width="20" height="4" fill="#0A1E4A" rx="2"/></svg>` },
  { rope: 42, dur: 2.8, delay: 0.4, svg: `<svg width="24" height="36" viewBox="0 0 24 36" fill="none"><rect x="2" y="4" width="20" height="28" rx="5" fill="#8A5500" opacity=".9"/><rect x="5" y="8" width="6" height="6" fill="#F5A623" opacity=".85" rx="1"/><rect x="13" y="8" width="6" height="6" fill="#F5A623" opacity=".85" rx="1"/><rect x="5" y="17" width="6" height="6" fill="#F5A623" opacity=".75" rx="1"/><rect x="13" y="17" width="6" height="6" fill="#F5A623" opacity=".7" rx="1"/><rect x="1" y="2" width="22" height="4" fill="#5A3500" rx="2"/><rect x="1" y="30" width="22" height="5" fill="#5A3500" rx="2"/></svg>` },
  { rope: 22, dur: 2.1, delay: 1.1, svg: `<svg width="20" height="30" viewBox="0 0 20 30" fill="none"><rect x="2" y="4" width="16" height="20" rx="4" fill="#2A1A7A" opacity=".9"/><rect x="4" y="7" width="5" height="5" fill="#F5D040" opacity=".8" rx="1"/><rect x="11" y="7" width="5" height="5" fill="#F5D040" opacity=".8" rx="1"/><rect x="4" y="15" width="5" height="5" fill="#F5D040" opacity=".7" rx="1"/><rect x="11" y="15" width="5" height="5" fill="#F5D040" opacity=".65" rx="1"/><rect x="1" y="2" width="18" height="4" fill="#1A0A5A" rx="2"/><rect x="1" y="22" width="18" height="4" fill="#1A0A5A" rx="2"/></svg>` },
]

// ── Sssalem verdict quotes ───────────────────────────────────────────────────
function getVerdict(band: string): string {
  switch (band) {
    case "strong":
      return "The scales tip heavily in your favour, friend. This merchant has undervalued you. Let Sssalem show you what you are truly worth."
    case "good":
      return "A fair position, friend. Worth the conversation. Sssalem has seen far weaker hands win at this table."
    case "possible":
      return "The scales are balanced — but every merchant knows, a balanced scale can be tipped with the right words."
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

  // Don't render until data is loaded
  if (!formData || !scoreResult) {
    return (
      <div style={{
        background: "var(--bg)",
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
        <p style={{
          fontFamily: "var(--fd)",
          fontSize: 13,
          letterSpacing: ".14em",
          textTransform: "uppercase",
          color: "var(--gold)",
          animation: "lpulse 1.6s ease-in-out infinite",
        }}>
          Consulting the scales
        </p>
      </div>
    )
  }

  const hatHook = getHatHook(scoreResult.band)
  const verdictQuote = getVerdict(scoreResult.band)

  return (
    <div style={{
      background: "var(--bg)",
      color: "var(--cream)",
      fontFamily: "var(--fb)",
      minHeight: "100dvh",
      width: "100%",
      overflowX: "hidden",
      position: "relative",
    }}>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />

      {/* Arabesque background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: arabesqueBg, pointerEvents: "none" }} />

      {/* Ambient glow */}
      <div style={{
        position: "fixed",
        top: "-20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 700,
        height: 400,
        background: "radial-gradient(ellipse, rgba(212,168,67,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Lanterns */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 80,
        zIndex: 20,
        pointerEvents: "none",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-around",
      }}>
        {LANTERNS.map((l, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              animation: `lsw ${l.dur}s ease-in-out ${l.delay}s infinite`,
              transformOrigin: "top center",
            }}
          >
            <div style={{ width: 1.5, height: l.rope, background: "rgba(212,168,67,0.5)" }} />
            <div dangerouslySetInnerHTML={{ __html: l.svg }} />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{
        position: "relative",
        zIndex: 10,
        padding: "90px 20px 80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        <div style={{ maxWidth: 500, width: "100%" }}>

          {/* Ornament header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, rgba(212,168,67,0.5), transparent)" }} />
            <span style={{
              fontFamily: "var(--fd)",
              fontSize: 9,
              letterSpacing: ".2em",
              textTransform: "uppercase",
              color: "var(--gold)",
              opacity: 0.7,
            }}>
              &#10022; SSSALEM&#39;S VERDICT &#10022;
            </span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, rgba(212,168,67,0.5), transparent)" }} />
          </div>

          {/* ── Score Card ── */}
          <div style={{
            background: "linear-gradient(160deg, #1A0F06, #0D0804)",
            border: "1px solid rgba(212,168,67,0.25)",
            borderRadius: 16,
            overflow: "hidden",
            marginBottom: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,168,67,0.08)",
            animation: "fadeSlideIn 0.6s ease-out both",
          }}>
            {/* Score top */}
            <div style={{
              padding: "28px 24px 20px",
              textAlign: "center",
              borderBottom: "1px solid rgba(212,168,67,0.12)",
            }}>
              <div style={{
                fontFamily: "var(--fd)",
                fontSize: 9,
                letterSpacing: ".25em",
                textTransform: "uppercase",
                color: "var(--gold)",
                opacity: 0.65,
                marginBottom: 18,
              }}>
                The scales have spoken
              </div>
              <div style={{
                fontFamily: "var(--fd)",
                fontSize: 96,
                fontWeight: 900,
                lineHeight: 0.9,
                color: scoreResult.bandColor,
                animation: "scorepop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both",
              }}>
                {scoreResult.score}
              </div>
              <div style={{
                fontFamily: "var(--fd)",
                fontSize: 22,
                color: "var(--dim)",
                fontWeight: 400,
              }}>
                /100
              </div>
              <div style={{
                fontFamily: "var(--fd)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                margin: "12px 0 10px",
                color: scoreResult.bandColor,
              }}>
                {scoreResult.bandLabel}
              </div>
              <p style={{
                fontSize: 15,
                fontStyle: "italic",
                color: "var(--cream2)",
                lineHeight: 1.65,
                maxWidth: 340,
                margin: "0 auto",
              }}>
                &#8220;{verdictQuote}&#8221;
              </p>
            </div>

            {/* Score stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <ScoreStat label="Your offer" value={`\u00A3${formData.salary.toLocaleString("en-GB")}`} position="tl" />
              <ScoreStat label="Market range" value={`\u00A3${scoreResult.marketLow.toLocaleString("en-GB")} \u2013 \u00A3${scoreResult.marketHigh.toLocaleString("en-GB")}`} position="tr" />
              <ScoreStat
                label="Market position"
                value={scoreResult.gapLow > 0
                  ? `\u00A3${scoreResult.gapLow.toLocaleString("en-GB")} below mid`
                  : "Within or above range"}
                color={scoreResult.gapLow > 0 ? "var(--red)" : undefined}
                position="bl"
              />
              <ScoreStat
                label="Typical uplift"
                value={`\u00A3${scoreResult.upliftLow.toLocaleString("en-GB")} \u2013 \u00A3${scoreResult.upliftHigh.toLocaleString("en-GB")}`}
                color="#22c55e"
                position="br"
              />
            </div>
          </div>

          {/* ── Error State ── */}
          {streamError && (
            <ErrorCard type={streamError} onRetry={handleRetry} />
          )}

          {/* ── Streaming indicator ── */}
          {!streamError && !streamDone && (
            <div style={{
              textAlign: "center",
              marginBottom: 16,
              fontFamily: "var(--fd)",
              fontSize: 11,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              color: "var(--gold)",
              animation: "lpulse 1.6s ease-in-out infinite",
            }}>
              Sssalem is writing your playbook...
            </div>
          )}

          {/* ── Playbook Sections ── */}
          {!streamError && sections.map((section, i) => {
            const def = SECTION_DEFS[i]
            if (section.status === "skeleton" && !streamDone) {
              return (
                <div
                  key={section.id}
                  style={{
                    background: "rgba(26,15,6,0.7)",
                    border: "1px solid rgba(212,168,67,0.15)",
                    borderRadius: 14,
                    padding: 22,
                    marginBottom: 12,
                  }}
                >
                  <div style={{
                    fontFamily: "var(--fd)",
                    fontSize: 9,
                    letterSpacing: ".2em",
                    textTransform: "uppercase",
                    color: "var(--gold)",
                    opacity: 0.65,
                    marginBottom: 8,
                  }}>
                    &#10022; {def.eyebrow}
                  </div>
                  <div style={{
                    fontFamily: "var(--fd)",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--cream)",
                    marginBottom: 14,
                  }}>
                    {def.title}
                  </div>
                  {/* Skeleton lines */}
                  {[85, 72, 90, 65].map((w, j) => (
                    <div
                      key={j}
                      style={{
                        height: 10,
                        borderRadius: 4,
                        background: "rgba(212,168,67,0.1)",
                        width: `${w}%`,
                        marginBottom: 8,
                        animation: `pulse 1.5s ease-in-out infinite ${j * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              )
            }

            if (!section.content && section.status === "skeleton") return null

            // ── Email section gets tabs ──
            if (section.id === "email") {
              const emailSection = sections.find((s) => s.id === "email")
              const scriptSection = sections.find((s) => s.id === "script")
              if (!emailSection?.content && !scriptSection?.content) {
                if (section.status === "skeleton") return null
              }
              // Only render the combined tab view on the email section
              return (
                <div
                  key={section.id}
                  style={{
                    background: "rgba(26,15,6,0.7)",
                    border: "1px solid rgba(212,168,67,0.15)",
                    borderRadius: 14,
                    padding: 22,
                    marginBottom: 12,
                    animation: "secin 0.4s ease both",
                  }}
                >
                  <div style={{
                    fontFamily: "var(--fd)",
                    fontSize: 9,
                    letterSpacing: ".2em",
                    textTransform: "uppercase",
                    color: "var(--gold)",
                    opacity: 0.65,
                    marginBottom: 8,
                  }}>
                    &#10022; The message
                  </div>
                  <div style={{
                    fontFamily: "var(--fd)",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--cream)",
                    marginBottom: 4,
                  }}>
                    Ready to send
                  </div>

                  {/* Tabs */}
                  <div style={{
                    display: "flex",
                    gap: 0,
                    marginTop: 16,
                    marginBottom: 16,
                    border: "1px solid rgba(212,168,67,0.2)",
                    borderRadius: 8,
                    overflow: "hidden",
                  }}>
                    <button
                      onClick={() => setActiveTab("email")}
                      style={{
                        flex: 1,
                        padding: 9,
                        background: activeTab === "email" ? "rgba(245,166,35,0.15)" : "transparent",
                        border: "none",
                        fontFamily: "var(--fd)",
                        fontSize: 9,
                        letterSpacing: ".12em",
                        textTransform: "uppercase",
                        color: activeTab === "email" ? "var(--amber)" : "var(--dim)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      Email
                    </button>
                    <button
                      onClick={() => setActiveTab("verbal")}
                      style={{
                        flex: 1,
                        padding: 9,
                        background: activeTab === "verbal" ? "rgba(245,166,35,0.15)" : "transparent",
                        border: "none",
                        fontFamily: "var(--fd)",
                        fontSize: 9,
                        letterSpacing: ".12em",
                        textTransform: "uppercase",
                        color: activeTab === "verbal" ? "var(--amber)" : "var(--dim)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      Verbal
                    </button>
                  </div>

                  {/* Content */}
                  <div style={{
                    background: "rgba(12,8,4,0.6)",
                    borderRadius: 8,
                    padding: 16,
                    fontSize: 13,
                    color: "var(--cream2)",
                    lineHeight: 1.8,
                    fontStyle: "italic",
                    whiteSpace: "pre-wrap",
                  }}>
                    {activeTab === "email"
                      ? (emailSection?.content || "Awaiting the scroll...")
                      : (scriptSection?.content || "Awaiting the spoken word...")}
                  </div>

                  {/* Copy button */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                    <button
                      onClick={() => {
                        const text = activeTab === "email" ? emailSection?.content : scriptSection?.content
                        if (text) handleCopy(activeTab, text)
                      }}
                      style={{
                        padding: "8px 16px",
                        background: copied[activeTab] ? "rgba(34,197,94,0.2)" : "rgba(245,166,35,0.15)",
                        border: `1px solid ${copied[activeTab] ? "rgba(34,197,94,0.4)" : "rgba(245,166,35,0.3)"}`,
                        borderRadius: 6,
                        fontFamily: "var(--fd)",
                        fontSize: 9,
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                        color: copied[activeTab] ? "#22c55e" : "var(--amber)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {copied[activeTab] ? "Copied \u2713" : "Copy \u2192"}
                    </button>
                  </div>
                </div>
              )
            }

            // Skip the script section — it's rendered inside the email tabs
            if (section.id === "script") return null

            // ── Standard section ──
            return (
              <div
                key={section.id}
                style={{
                  background: "rgba(26,15,6,0.7)",
                  border: "1px solid rgba(212,168,67,0.15)",
                  borderRadius: 14,
                  padding: 22,
                  marginBottom: 12,
                  animation: "secin 0.4s ease both",
                }}
              >
                <div style={{
                  fontFamily: "var(--fd)",
                  fontSize: 9,
                  letterSpacing: ".2em",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  opacity: 0.65,
                  marginBottom: 8,
                }}>
                  &#10022; {def.eyebrow}
                </div>
                <div style={{
                  fontFamily: "var(--fd)",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--cream)",
                  marginBottom: 4,
                }}>
                  {def.title}
                </div>

                {/* Negotiable section gets tier accordions */}
                {section.id === "negotiable" && section.content ? (
                  <NegotiableContent
                    content={section.content}
                    openTiers={openTiers}
                    toggleTier={toggleTier}
                  />
                ) : (
                  <div style={{
                    fontSize: 14,
                    color: "var(--muted)",
                    lineHeight: 1.75,
                    marginTop: 14,
                    whiteSpace: "pre-wrap",
                  }}>
                    {section.content}
                  </div>
                )}
              </div>
            )
          })}

          {/* ── Copy full report ── */}
          {streamDone && !streamError && (
            <button
              onClick={handleCopyFullReport}
              style={{
                width: "100%",
                padding: 13,
                marginBottom: 12,
                background: copied.full ? "rgba(34,197,94,0.15)" : "rgba(245,166,35,0.15)",
                border: `1px solid ${copied.full ? "rgba(34,197,94,0.3)" : "rgba(245,166,35,0.3)"}`,
                borderRadius: 8,
                fontFamily: "var(--fd)",
                fontSize: 10,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: copied.full ? "#22c55e" : "var(--amber)",
                cursor: "pointer",
                transition: "all 0.15s",
                animation: "secin 0.4s ease both",
              }}
            >
              {copied.full ? "Copied full report \u2713" : "Copy full report \u2192"}
            </button>
          )}

          {/* ── Hat Section ── */}
          <div style={{
            background: "linear-gradient(135deg, rgba(58,188,189,0.1), rgba(26,113,114,0.08))",
            border: "1px solid rgba(58,188,189,0.2)",
            borderRadius: 14,
            padding: 20,
            textAlign: "center",
            marginTop: 8,
          }}>
            <div style={{ fontSize: 12, color: "var(--dim)", fontStyle: "italic", marginBottom: 10, lineHeight: 1.6 }}>
              &#8220;{hatHook.line}&#8221;
            </div>
            <div style={{
              fontFamily: "var(--fd)",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--teal)",
              marginBottom: 12,
            }}>
              {hatHook.hat}
            </div>
            <a
              href="https://shop.randomorium.ai"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "10px 24px",
                background: "var(--teal2)",
                color: "var(--cream)",
                fontFamily: "var(--fd)",
                fontSize: 10,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                borderRadius: 7,
                textDecoration: "none",
                transition: "all 0.15s",
              }}
            >
              Visit the Shop &rarr;
            </a>
          </div>

          {/* ── Start Over ── */}
          <Link
            href="/apps/salary"
            style={{
              display: "block",
              width: "100%",
              padding: 13,
              marginTop: 10,
              background: "transparent",
              border: "1.5px solid rgba(212,168,67,0.2)",
              borderRadius: 8,
              color: "var(--dim)",
              fontFamily: "var(--fd)",
              fontSize: 10,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              textAlign: "center",
              textDecoration: "none",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            &#8617; Start over with a new offer
          </Link>

          <div style={{ height: 60 }} />
        </div>
      </div>

      {/* Hat footer */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "rgba(12,8,4,0.95)",
        borderTop: "1px solid rgba(212,168,67,0.12)",
        padding: "9px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <a
          href="https://shop.randomorium.ai"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 11,
            color: "var(--dim)",
            textDecoration: "none",
            fontFamily: "var(--fd)",
            letterSpacing: ".06em",
          }}
        >
          Part of <span style={{ color: "var(--teal)" }}>randomorium.ai</span> &middot; Buy a hat &rarr;
        </a>
      </div>
    </div>
  )
}

// ── Score Stat cell ──────────────────────────────────────────────────────────
function ScoreStat({
  label,
  value,
  color,
  position,
}: {
  label: string
  value: string
  color?: string
  position: "tl" | "tr" | "bl" | "br"
}) {
  return (
    <div style={{
      padding: "16px 20px",
      borderRight: position === "tl" || position === "bl" ? "1px solid rgba(212,168,67,0.1)" : "none",
      borderBottom: position === "tl" || position === "tr" ? "1px solid rgba(212,168,67,0.1)" : "none",
    }}>
      <div style={{
        fontFamily: "var(--fd)",
        fontSize: 8,
        letterSpacing: ".15em",
        textTransform: "uppercase",
        color: "var(--dim)",
        marginBottom: 5,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "var(--fd)",
        fontSize: 16,
        fontWeight: 700,
        color: color ?? "var(--cream)",
      }}>
        {value}
      </div>
    </div>
  )
}

// ── Error Card ──────────────────────────────────────────────────────────────
function ErrorCard({ type, onRetry }: { type: string; onRetry: () => void }) {
  const messages: Record<string, { title: string; body: string; showRetry: boolean }> = {
    api_key_missing: {
      title: "The scales cannot be read",
      body: "The ANTHROPIC_API_KEY is not configured on Vercel. Go to Vercel > Settings > Environment Variables, add ANTHROPIC_API_KEY with your Anthropic API key, and redeploy.",
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
    <div style={{
      background: "rgba(26,15,6,0.7)",
      border: "1px solid rgba(194,59,34,0.3)",
      borderRadius: 14,
      padding: 22,
      marginBottom: 12,
      animation: "secin 0.4s ease both",
    }}>
      <div style={{
        fontFamily: "var(--fd)",
        fontSize: 16,
        fontWeight: 700,
        color: "var(--cream)",
        marginBottom: 8,
      }}>
        {msg.title}
      </div>
      <div style={{
        fontSize: 14,
        color: "var(--muted)",
        lineHeight: 1.7,
        marginBottom: msg.showRetry ? 16 : 0,
      }}>
        {msg.body}
      </div>
      {msg.showRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: "10px 24px",
            background: "linear-gradient(135deg, var(--amber), var(--amber2))",
            border: "none",
            borderRadius: 8,
            color: "var(--bg)",
            fontFamily: "var(--fd)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.15s",
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
function NegotiableContent({
  content,
  openTiers,
  toggleTier,
}: {
  content: string
  openTiers: Record<string, boolean>
  toggleTier: (tier: string) => void
}) {
  // Try to parse tiers from content
  const tiers = parseTiers(content)

  if (tiers.length === 0) {
    return (
      <div style={{
        fontSize: 14,
        color: "var(--muted)",
        lineHeight: 1.75,
        marginTop: 14,
        whiteSpace: "pre-wrap",
      }}>
        {content}
      </div>
    )
  }

  return (
    <div style={{ marginTop: 14 }}>
      {tiers.map((tier) => (
        <div key={tier.id} style={{ marginBottom: 14 }}>
          <div
            onClick={() => toggleTier(tier.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "var(--fd)",
              fontSize: 9,
              letterSpacing: ".15em",
              textTransform: "uppercase",
              color: "var(--dim)",
              marginBottom: 8,
              cursor: "pointer",
            }}
          >
            {tier.icon} {tier.label}
            <span style={{
              fontSize: 14,
              marginLeft: "auto",
              transition: "transform 0.2s",
              transform: openTiers[tier.id] ? "rotate(90deg)" : "rotate(0deg)",
            }}>
              &rsaquo;
            </span>
          </div>
          {openTiers[tier.id] && (
            <div>
              {tier.items.map((item, j) => (
                <div
                  key={j}
                  style={{
                    padding: "10px 12px",
                    borderLeft: "2px solid rgba(212,168,67,0.25)",
                    marginBottom: 8,
                  }}
                >
                  <div style={{
                    fontSize: 13,
                    color: "var(--cream2)",
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
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
interface Tier {
  id: string
  icon: string
  label: string
  items: string[]
}

function parseTiers(content: string): Tier[] {
  const tiers: Tier[] = []
  const lines = content.split("\n")

  const tierPatterns = [
    { pattern: /high\s*probability/i, id: "high", icon: "\uD83D\uDFE1", label: "High value / high probability" },
    { pattern: /medium\s*probability/i, id: "medium", icon: "\uD83D\uDFE0", label: "Worth pursuing / medium probability" },
    { pattern: /low\s*probability/i, id: "low", icon: "\u26AA", label: "Low probability / zero cost to ask" },
  ]

  let currentTier: Tier | null = null
  let currentItem = ""

  for (const line of lines) {
    const trimmed = line.trim()

    // Check if this line starts a new tier
    let matched = false
    for (const tp of tierPatterns) {
      if (tp.pattern.test(trimmed)) {
        // Save previous tier
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

    // If we're in a tier, collect items
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

  // Save last tier
  if (currentTier) {
    if (currentItem.trim()) currentTier.items.push(currentItem.trim())
    tiers.push(currentTier)
  }

  return tiers
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
    script: ["VERBAL SCRIPT", "THE SPOKEN WORD"],
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
