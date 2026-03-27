"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { FormData, ExperienceLevel } from "@/lib/salary/types"
import { parseSalary } from "@/lib/salary/parseSalary"
import { calculateScore } from "@/lib/salary/scoring"
import { buildUserPrompt } from "@/lib/salary/prompts"
import { SECTOR_OPTIONS, LOCATIONS, SITUATIONS, EXPERIENCE_LEVELS } from "@/lib/salary/marketData"

// ── CSS custom properties + keyframes ────────────────────────────────────────
const globalStyles = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Lora:ital,wght@0,400;0,500;1,400;1,500&display=swap');

:root {
  --bg: #0C0804;
  --bg2: #1A0F06;
  --amber: #F5A623;
  --amber2: #C47D0E;
  --teal: #3ABCBD;
  --cream: #F0E4C4;
  --cream2: #D4C49A;
  --gold: #D4A843;
  --gold2: #A07820;
  --muted: rgba(240,228,196,0.45);
  --dim: rgba(240,228,196,0.22);
  --fd: 'Cinzel', serif;
  --fb: 'Lora', serif;
}

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeSlideOut {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-18px); }
}
@keyframes sglow {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
@keyframes lsw {
  0%, 100% { transform: rotate(-6deg); }
  50% { transform: rotate(6deg); }
}
@keyframes scalesway {
  0%, 100% { transform: rotate(-8deg); }
  50% { transform: rotate(8deg); }
}
@keyframes lpulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
`

// ── Lantern SVGs ─────────────────────────────────────────────────────────────
const LANTERNS = [
  { cls: "lan-0", rope: 20, svg: `<svg width="22" height="32" viewBox="0 0 22 32" fill="none"><rect x="3" y="4" width="16" height="22" rx="4" fill="#8A3010" opacity=".9"/><rect x="5" y="7" width="5" height="5" fill="#F5A623" opacity=".8" rx="1"/><rect x="12" y="7" width="5" height="5" fill="#F5A623" opacity=".8" rx="1"/><rect x="5" y="15" width="5" height="5" fill="#F5A623" opacity=".7" rx="1"/><rect x="12" y="15" width="5" height="5" fill="#F5A623" opacity=".7" rx="1"/><rect x="1" y="2" width="20" height="4" fill="#6A2008" rx="2"/><rect x="1" y="24" width="20" height="4" fill="#6A2008" rx="2"/><ellipse cx="11" cy="13" rx="18" ry="14" fill="#F5A623" opacity=".07"/></svg>` },
  { cls: "lan-1", rope: 35, svg: `<svg width="26" height="38" viewBox="0 0 26 38" fill="none"><rect x="3" y="5" width="20" height="26" rx="5" fill="#1A5A3A" opacity=".9"/><rect x="5" y="9" width="7" height="6" fill="#F5A623" opacity=".8" rx="1"/><rect x="14" y="9" width="7" height="6" fill="#F5A623" opacity=".8" rx="1"/><rect x="5" y="18" width="7" height="6" fill="#F5A623" opacity=".7" rx="1"/><rect x="14" y="18" width="7" height="6" fill="#F5A623" opacity=".65" rx="1"/><rect x="1" y="3" width="24" height="4" fill="#0F3D26" rx="2"/><rect x="1" y="29" width="24" height="5" fill="#0F3D26" rx="2"/><ellipse cx="13" cy="18" rx="22" ry="17" fill="#F5A623" opacity=".08"/></svg>` },
  { cls: "lan-2", rope: 15, svg: `<svg width="30" height="44" viewBox="0 0 30 44" fill="none"><rect x="3" y="5" width="24" height="32" rx="6" fill="#7A1A5A" opacity=".9"/><rect x="6" y="9" width="8" height="7" fill="#F5A623" opacity=".85" rx="1.5"/><rect x="16" y="9" width="8" height="7" fill="#F5A623" opacity=".85" rx="1.5"/><rect x="6" y="19" width="8" height="7" fill="#F5A623" opacity=".75" rx="1.5"/><rect x="16" y="19" width="8" height="7" fill="#F5A623" opacity=".75" rx="1.5"/><rect x="6" y="29" width="18" height="5" fill="#F5A623" opacity=".6" rx="1"/><rect x="1" y="3" width="28" height="5" fill="#5A0A3A" rx="2"/><rect x="1" y="35" width="28" height="6" fill="#5A0A3A" rx="2"/><ellipse cx="15" cy="20" rx="26" ry="20" fill="#F5A623" opacity=".1"/></svg>` },
  { cls: "lan-3", rope: 28, svg: `<svg width="22" height="32" viewBox="0 0 22 32" fill="none"><rect x="3" y="4" width="16" height="22" rx="4" fill="#1A3A7A" opacity=".9"/><rect x="5" y="7" width="5" height="5" fill="#F5C040" opacity=".8" rx="1"/><rect x="12" y="7" width="5" height="5" fill="#F5C040" opacity=".8" rx="1"/><rect x="5" y="15" width="5" height="5" fill="#F5C040" opacity=".7" rx="1"/><rect x="12" y="15" width="5" height="5" fill="#F5C040" opacity=".7" rx="1"/><rect x="1" y="2" width="20" height="4" fill="#0A1E4A" rx="2"/><rect x="1" y="24" width="20" height="4" fill="#0A1E4A" rx="2"/><ellipse cx="11" cy="13" rx="18" ry="14" fill="#F5C040" opacity=".08"/></svg>` },
  { cls: "lan-4", rope: 42, svg: `<svg width="24" height="36" viewBox="0 0 24 36" fill="none"><rect x="2" y="4" width="20" height="28" rx="5" fill="#8A5500" opacity=".9"/><rect x="5" y="8" width="6" height="6" fill="#F5A623" opacity=".85" rx="1"/><rect x="13" y="8" width="6" height="6" fill="#F5A623" opacity=".85" rx="1"/><rect x="5" y="17" width="6" height="6" fill="#F5A623" opacity=".75" rx="1"/><rect x="13" y="17" width="6" height="6" fill="#F5A623" opacity=".7" rx="1"/><rect x="1" y="2" width="22" height="4" fill="#5A3500" rx="2"/><rect x="1" y="30" width="22" height="5" fill="#5A3500" rx="2"/><ellipse cx="12" cy="18" rx="20" ry="16" fill="#F5A623" opacity=".09"/></svg>` },
  { cls: "lan-5", rope: 22, svg: `<svg width="20" height="30" viewBox="0 0 20 30" fill="none"><rect x="2" y="4" width="16" height="20" rx="4" fill="#2A1A7A" opacity=".9"/><rect x="4" y="7" width="5" height="5" fill="#F5D040" opacity=".8" rx="1"/><rect x="11" y="7" width="5" height="5" fill="#F5D040" opacity=".8" rx="1"/><rect x="4" y="15" width="5" height="5" fill="#F5D040" opacity=".7" rx="1"/><rect x="11" y="15" width="5" height="5" fill="#F5D040" opacity=".65" rx="1"/><rect x="1" y="2" width="18" height="4" fill="#1A0A5A" rx="2"/><rect x="1" y="22" width="18" height="4" fill="#1A0A5A" rx="2"/><ellipse cx="10" cy="12" rx="16" ry="12" fill="#F5D040" opacity=".08"/></svg>` },
]

// ── Sssalem SVG ──────────────────────────────────────────────────────────────
const SssalemSVG = `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="100" cy="188" rx="60" ry="8" fill="rgba(0,0,0,0.5)"/><path d="M68 120 Q65 160 55 188 L145 188 Q135 160 132 120 Z" fill="#4A2808"/><path d="M70 120 Q68 155 60 188 L100 188 Z" fill="#3A1E04" opacity=".5"/><path d="M80 125 Q78 155 72 182" stroke="#6A3810" stroke-width="1.5" opacity=".6"/><path d="M100 122 Q100 160 100 185" stroke="#6A3810" stroke-width="1.5" opacity=".4"/><path d="M120 125 Q122 155 128 182" stroke="#6A3810" stroke-width="1.5" opacity=".6"/><rect x="70" y="126" width="60" height="8" rx="4" fill="#8A5510"/><circle cx="100" cy="130" r="4" fill="#D4A843"/><path d="M75 115 Q60 120 52 135" stroke="#5A3008" stroke-width="10" stroke-linecap="round"/><path d="M125 115 Q140 120 148 135" stroke="#5A3008" stroke-width="10" stroke-linecap="round"/><line x1="52" y1="135" x2="148" y2="135" stroke="#D4A843" stroke-width="2.5"/><circle cx="100" cy="133" r="5" fill="#D4A843"/><line x1="65" y1="135" x2="65" y2="155" stroke="#D4A843" stroke-width="1.5"/><line x1="135" y1="135" x2="135" y2="148" stroke="#D4A843" stroke-width="1.5"/><ellipse cx="65" cy="158" rx="16" ry="5" fill="#C89030" opacity=".9"/><path d="M49 155 Q65 165 81 155" fill="#A87020" opacity=".7"/><ellipse cx="135" cy="151" rx="14" ry="4.5" fill="#C89030" opacity=".9"/><path d="M121 148 Q135 158 149 148" fill="#A87020" opacity=".7"/><circle cx="60" cy="153" r="4" fill="#D4A843"/><circle cx="68" cy="154" r="3.5" fill="#C89030"/><circle cx="64" cy="150" r="3" fill="#D4A843"/><path d="M72 95 Q68 115 70 122 L130 122 Q132 115 128 95 Z" fill="#5A3010"/><path d="M90 95 L100 120 L110 95" stroke="#8A5520" stroke-width="2" fill="none"/><circle cx="100" cy="72" r="26" fill="#8A6040"/><ellipse cx="94" cy="74" rx="3" ry="3.5" fill="#2A1A08"/><ellipse cx="106" cy="74" rx="3" ry="3.5" fill="#2A1A08"/><ellipse cx="93.5" cy="73.5" rx="1.2" ry="1.5" fill="white" opacity=".9"/><ellipse cx="105.5" cy="73.5" rx="1.2" ry="1.5" fill="white" opacity=".9"/><path d="M92 82 Q100 88 108 82" stroke="#5A3820" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M90 68 Q94 66 98 68" stroke="#4A2A10" stroke-width="2" stroke-linecap="round"/><path d="M102 68 Q106 66 110 68" stroke="#4A2A10" stroke-width="2" stroke-linecap="round"/><path d="M88 86 Q100 98 112 86 Q108 95 100 98 Q92 95 88 86 Z" fill="#5A3818"/><ellipse cx="100" cy="58" rx="28" ry="16" fill="#2A6888"/><path d="M72 58 Q75 44 100 42 Q125 44 128 58" fill="#1A4A66"/><path d="M74 56 Q85 48 100 46 Q115 48 126 56" stroke="#3A88AA" stroke-width="2.5" fill="none" opacity=".6"/><path d="M76 62 Q88 68 100 66 Q112 68 124 62" stroke="#3A88AA" stroke-width="2" fill="none" opacity=".4"/><circle cx="100" cy="50" r="5" fill="#D4A843"/><circle cx="100" cy="50" r="3" fill="#F5C040"/><path d="M72 60 Q65 68 68 76 Q72 80 75 76 Q73 70 76 66 Q78 62 72 60 Z" fill="#1A4A66"/><rect x="35" y="165" width="14" height="18" rx="3" fill="#6A3010" opacity=".8"/><ellipse cx="42" cy="165" rx="8" ry="4" fill="#8A4018" opacity=".9"/><ellipse cx="42" cy="163" rx="6" ry="2.5" fill="#C86020" opacity=".9"/><rect x="150" y="168" width="16" height="14" rx="2" fill="#D4C490" opacity=".7"/><ellipse cx="158" cy="168" rx="9" ry="4" fill="#C4B478" opacity=".8"/><ellipse cx="158" cy="182" rx="9" ry="4" fill="#C4B478" opacity=".8"/><ellipse cx="100" cy="140" rx="50" ry="18" fill="#F5A623" opacity=".04"/></svg>`

// ── Arabesque background ─────────────────────────────────────────────────────
const arabesqueBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M40 2 L78 40 L40 78 L2 40 Z' fill='none' stroke='rgba(212,168,67,0.07)' stroke-width='1'/%3E%3Cpath d='M40 14 L66 40 L40 66 L14 40 Z' fill='none' stroke='rgba(212,168,67,0.05)' stroke-width='1'/%3E%3Ccircle cx='40' cy='40' r='6' fill='none' stroke='rgba(212,168,67,0.06)' stroke-width='1'/%3E%3Ccircle cx='2' cy='2' r='2' fill='rgba(212,168,67,0.06)'/%3E%3Ccircle cx='78' cy='2' r='2' fill='rgba(212,168,67,0.06)'/%3E%3Ccircle cx='2' cy='78' r='2' fill='rgba(212,168,67,0.06)'/%3E%3Ccircle cx='78' cy='78' r='2' fill='rgba(212,168,67,0.06)'/%3E%3C/svg%3E")`

// ── Loading scales SVG ───────────────────────────────────────────────────────
const LoadingScalesSVG = `<svg width="80" height="60" viewBox="0 0 80 60" fill="none"><line x1="10" y1="28" x2="70" y2="28" stroke="#D4A843" stroke-width="2.5"/><circle cx="40" cy="26" r="5" fill="#D4A843"/><line x1="22" y1="28" x2="22" y2="44" stroke="#D4A843" stroke-width="1.5"/><line x1="58" y1="28" x2="58" y2="38" stroke="#D4A843" stroke-width="1.5"/><ellipse cx="22" cy="46" rx="14" ry="4" fill="#C89030" opacity=".9"/><ellipse cx="58" cy="40" rx="12" ry="3.5" fill="#C89030" opacity=".9"/><circle cx="18" cy="42" r="3" fill="#D4A843"/><circle cx="25" cy="43" r="2.5" fill="#C89030"/><circle cx="22" cy="40" r="2" fill="#D4A843"/><line x1="40" y1="0" x2="40" y2="22" stroke="#C89030" stroke-width="2"/></svg>`

// ── Component ────────────────────────────────────────────────────────────────
export default function SalaryNegotiator() {
  const router = useRouter()
  const [step, setStep] = useState(0) // 0=landing, 1-5=form steps, 6=loading
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

  // Parse salary from offer text
  const detectedSalary = useMemo(() => parseSalary(offerText), [offerText])
  const salary = detectedSalary ?? (manualSalary ? parseInt(manualSalary, 10) || null : null)

  // Step navigation with transition
  const goToStep = useCallback((n: number) => {
    setTransitioning(true)
    setTimeout(() => {
      setStep(n)
      setTransitioning(false)
    }, 400)
  }, [])

  // Validation per step
  const canContinue = useMemo(() => {
    switch (step) {
      case 1: return offerText.trim().length > 0
      case 2: return sector !== "" && jobTitle.trim().length > 0
      case 3: return location !== ""
      case 4: return experience !== ""
      case 5: return situation !== ""
      default: return true
    }
  }, [step, offerText, sector, jobTitle, location, experience, situation])

  // Submit analysis
  const handleSubmit = useCallback(() => {
    if (!salary || !experience) return

    goToStep(6) // loading screen

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

    // Brief delay for the loading screen to show
    setTimeout(() => {
      router.push("/apps/salary/result")
    }, 2200)
  }, [offerText, salary, sector, jobTitle, location, experience, situation, hasDeadline, deadline, goToStep, router])

  return (
    <div
      style={{
        background: "var(--bg)",
        color: "var(--cream)",
        fontFamily: "var(--fb)",
        minHeight: "100dvh",
        width: "100%",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />

      {/* Arabesque background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundImage: arabesqueBg,
          pointerEvents: "none",
        }}
      />

      {/* Ambient glow */}
      <div
        style={{
          position: "fixed",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 400,
          background: "radial-gradient(ellipse, rgba(212,168,67,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Lanterns */}
      <div
        style={{
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
        }}
      >
        {LANTERNS.map((l, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              animation: `lsw ${[2.6, 2.2, 3.0, 2.4, 2.8, 2.1][i]}s ease-in-out ${[0, 0.55, 0.2, 0.85, 0.4, 1.1][i]}s infinite`,
              transformOrigin: "top center",
            }}
          >
            <div
              style={{
                width: 1.5,
                height: l.rope,
                background: "rgba(212,168,67,0.5)",
              }}
            />
            <div
              style={{ position: "relative" }}
              dangerouslySetInnerHTML={{ __html: l.svg }}
            />
          </div>
        ))}
      </div>

      {/* ── SCREENS ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: step === 0 ? "flex-start" : "center",
          padding: 20,
          paddingTop: step === 0 ? 90 : 20,
          overflowY: "auto",
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "translateY(-18px)" : "translateY(0)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        {step === 0 && <LandingScreen onStart={() => goToStep(1)} />}
        {step === 1 && (
          <StepScreen
            stepNum={1}
            title={<>&#8220;What have they<br />offered you?&#8221;</>}
            aside="Paste the offer letter, the email, or just describe the numbers. Do not be shy — the scales have heard worse."
            onBack={() => goToStep(0)}
            onNext={() => goToStep(2)}
            canContinue={canContinue}
          >
            <textarea
              value={offerText}
              onChange={(e) => setOfferText(e.target.value)}
              placeholder="e.g. Base salary £52,000, 10% annual bonus, 25 days holiday, private healthcare, 5% pension match, hybrid working 3 days in office..."
              rows={6}
              className="souk-textarea"
              style={soukInputStyle}
            />
            {detectedSalary ? (
              <p style={{ fontSize: 12, marginTop: 6, color: "#22c55e", fontFamily: "var(--fd)", letterSpacing: ".08em" }}>
                Detected: £{detectedSalary.toLocaleString("en-GB")}
              </p>
            ) : offerText.trim().length > 10 ? (
              <div style={{ marginTop: 10 }}>
                <p style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", marginBottom: 6 }}>
                  Sssalem cannot find a number. Enter it yourself:
                </p>
                <input
                  type="number"
                  value={manualSalary}
                  onChange={(e) => setManualSalary(e.target.value)}
                  placeholder="e.g. 45000"
                  style={soukInputStyle}
                />
              </div>
            ) : null}
          </StepScreen>
        )}
        {step === 2 && (
          <StepScreen
            stepNum={2}
            title={<>&#8220;What is your<br />trade?&#8221;</>}
            aside="Every souk has its own going rate. Sssalem needs to know your market."
            onBack={() => goToStep(1)}
            onNext={() => goToStep(3)}
            canContinue={canContinue}
          >
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              style={{
                ...soukInputStyle,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23D4A843' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 14px center",
                paddingRight: 40,
                cursor: "pointer",
                WebkitAppearance: "none",
                MozAppearance: "none" as never,
                appearance: "none" as never,
              }}
            >
              <option value="">Select your sector</option>
              {SECTOR_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div style={{ height: 14 }} />
            <label style={{
              fontFamily: "var(--fd)",
              fontSize: 10,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              color: "var(--dim)",
              display: "block",
              marginBottom: 8,
            }}>
              Your title in this trade
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Product Manager"
              style={soukInputStyle}
            />
          </StepScreen>
        )}
        {step === 3 && (
          <StepScreen
            stepNum={3}
            title={<>&#8220;And where does<br />this commerce<br />take place?&#8221;</>}
            aside="Location moves the market more than most people realise. London pays a steep premium. Sssalem accounts for this."
            onBack={() => goToStep(2)}
            onNext={() => goToStep(4)}
            canContinue={canContinue}
          >
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{
                ...soukInputStyle,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23D4A843' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 14px center",
                paddingRight: 40,
                cursor: "pointer",
                WebkitAppearance: "none",
                MozAppearance: "none" as never,
                appearance: "none" as never,
              }}
            >
              <option value="">Select your region</option>
              {LOCATIONS.map((l) => (
                <option key={l.label} value={l.label}>{l.label}</option>
              ))}
            </select>
          </StepScreen>
        )}
        {step === 4 && (
          <StepScreen
            stepNum={4}
            title={<>&#8220;How many seasons<br />have you walked<br />this path?&#8221;</>}
            aside="Experience is leverage. Sssalem knows the difference between a merchant and an apprentice."
            onBack={() => goToStep(3)}
            onNext={() => goToStep(5)}
            canContinue={canContinue}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setExperience(level.id)}
                  style={{
                    padding: "11px 18px",
                    border: `1.5px solid ${experience === level.id ? "var(--amber)" : "rgba(212,168,67,0.25)"}`,
                    borderRadius: 8,
                    fontFamily: "var(--fd)",
                    fontSize: 11,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    color: experience === level.id ? "var(--amber)" : "var(--muted)",
                    background: experience === level.id ? "rgba(245,166,35,0.18)" : "rgba(26,15,6,0.6)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                    boxShadow: experience === level.id ? "0 0 14px rgba(245,166,35,0.2)" : "none",
                  }}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </StepScreen>
        )}
        {step === 5 && (
          <StepScreen
            stepNum={5}
            title={<>&#8220;How did you come<br />to stand before<br />my stall?&#8221;</>}
            aside="The circumstances change everything. Sssalem must know the full picture before he reads the scales."
            onBack={() => goToStep(4)}
            onNext={handleSubmit}
            canContinue={canContinue}
            nextLabel="Read the Scales"
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 4 }}>
              {SITUATIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSituation(s.id)}
                  style={{
                    padding: "15px 14px",
                    border: `1.5px solid ${situation === s.id ? "var(--amber)" : "rgba(212,168,67,0.2)"}`,
                    borderRadius: 10,
                    background: situation === s.id ? "rgba(245,166,35,0.12)" : "rgba(26,15,6,0.6)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    textAlign: "left",
                    boxShadow: situation === s.id ? "0 0 18px rgba(245,166,35,0.15)" : "none",
                  }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
                  <div>
                    <div style={{
                      fontFamily: "var(--fd)",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      color: situation === s.id ? "var(--amber)" : "var(--cream2)",
                      lineHeight: 1.3,
                    }}>
                      {s.label}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Deadline toggle */}
            <div
              onClick={() => setHasDeadline(!hasDeadline)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 16,
                padding: "12px 16px",
                border: "1.5px solid rgba(212,168,67,0.15)",
                borderRadius: 8,
                background: "rgba(26,15,6,0.4)",
                cursor: "pointer",
              }}
            >
              <div style={{
                width: 42,
                height: 24,
                borderRadius: 12,
                background: hasDeadline ? "var(--amber2)" : "rgba(212,168,67,0.15)",
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
              }}>
                <div style={{
                  position: "absolute",
                  top: 3,
                  left: hasDeadline ? 21 : 3,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "var(--cream2)",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                }} />
              </div>
              <span style={{ fontSize: 13, color: "var(--muted)", fontStyle: "italic" }}>
                They are pressing me for an answer
              </span>
            </div>
            {hasDeadline && (
              <div style={{ marginTop: 10 }}>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  style={{ ...soukInputStyle, marginTop: 8 }}
                />
              </div>
            )}
          </StepScreen>
        )}
        {step === 6 && <LoadingScreen />}
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

// ── Landing Screen ───────────────────────────────────────────────────────────
function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      maxWidth: 520,
      width: "100%",
      textAlign: "center",
      animation: "fadeSlideIn 0.6s ease-out both",
    }}>
      {/* Stall label */}
      <p style={{
        fontFamily: "var(--fd)",
        fontSize: 9,
        letterSpacing: ".28em",
        textTransform: "uppercase",
        color: "var(--gold)",
        opacity: 0.7,
        marginBottom: 28,
      }}>
        &#10022; &nbsp; The Salary Souk &nbsp; &#10022;
      </p>

      {/* Sssalem illustration */}
      <div style={{
        position: "relative",
        width: 200,
        height: 200,
        marginBottom: 24,
      }}>
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 220,
          height: 220,
          background: "radial-gradient(ellipse, rgba(245,166,35,0.18) 0%, transparent 70%)",
          borderRadius: "50%",
          animation: "sglow 3s ease-in-out infinite",
        }} />
        <div dangerouslySetInnerHTML={{ __html: SssalemSVG }} />
      </div>

      {/* Ornament */}
      <p style={{
        fontFamily: "var(--fd)",
        fontSize: 9,
        letterSpacing: ".28em",
        textTransform: "uppercase",
        color: "var(--gold)",
        opacity: 0.7,
        marginBottom: 12,
      }}>
        &#10022; &nbsp; &#10022; &nbsp; &#10022;
      </p>

      <h1 style={{
        fontFamily: "var(--fd)",
        fontSize: "clamp(28px, 6vw, 42px)",
        fontWeight: 700,
        color: "var(--cream)",
        lineHeight: 1.1,
        marginBottom: 8,
        letterSpacing: ".01em",
      }}>
        You have been offered<br />a price.
      </h1>

      <p style={{
        fontSize: 16,
        fontStyle: "italic",
        color: "var(--muted)",
        lineHeight: 1.7,
        marginBottom: 6,
      }}>
        Let Sssalem consult the scales.<br />He has haggled in every souk from Fez to London.
      </p>

      <p style={{
        fontFamily: "var(--fd)",
        fontSize: 10,
        letterSpacing: ".12em",
        textTransform: "uppercase",
        color: "var(--gold)",
        opacity: 0.6,
        marginBottom: 32,
      }}>
        — Sssalem Al-Rashid, Proprietor
      </p>

      {/* Stats strip */}
      <div style={{
        display: "flex",
        gap: 0,
        marginBottom: 36,
        border: "1px solid rgba(212,168,67,0.2)",
        borderRadius: 10,
        overflow: "hidden",
        width: "100%",
      }}>
        {[
          { n: "84%", l: "of negotiations succeed" },
          { n: "5\u201311%", l: "typical uplift" },
          { n: "2 min", l: "to your verdict" },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              padding: "12px 8px",
              textAlign: "center",
              borderRight: i < 2 ? "1px solid rgba(212,168,67,0.15)" : "none",
            }}
          >
            <span style={{
              fontFamily: "var(--fd)",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--amber)",
              display: "block",
              marginBottom: 2,
            }}>{stat.n}</span>
            <span style={{ fontSize: 10, color: "var(--dim)", letterSpacing: ".05em" }}>{stat.l}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={onStart}
        style={{
          width: "100%",
          padding: "17px 28px",
          background: "linear-gradient(135deg, var(--amber), var(--amber2))",
          color: "var(--bg)",
          fontFamily: "var(--fd)",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          border: "none",
          borderRadius: 10,
          cursor: "pointer",
          boxShadow: "0 8px 32px rgba(245,166,35,0.35), 0 2px 8px rgba(245,166,35,0.2)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        Approach the Scales &rarr;
      </button>

      <p style={{
        marginTop: 14,
        fontSize: 11,
        color: "var(--dim)",
        fontStyle: "italic",
        letterSpacing: ".03em",
      }}>
        Free. No account. No nonsense.
      </p>
    </div>
  )
}

// ── Step Screen wrapper ──────────────────────────────────────────────────────
function StepScreen({
  stepNum,
  title,
  aside,
  onBack,
  onNext,
  canContinue,
  children,
  nextLabel = "Continue",
}: {
  stepNum: number
  title: React.ReactNode
  aside: string
  onBack: () => void
  onNext: () => void
  canContinue: boolean
  children: React.ReactNode
  nextLabel?: string
}) {
  return (
    <div style={{
      maxWidth: 480,
      width: "100%",
      display: "flex",
      flexDirection: "column",
      animation: "fadeSlideIn 0.45s ease-out both",
    }}>
      {/* Progress dots */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginBottom: 40,
      }}>
        {[1, 2, 3, 4, 5].map((dot) => (
          <div
            key={dot}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: dot < stepNum
                ? "var(--gold)"
                : dot === stepNum
                  ? "var(--amber)"
                  : "rgba(212,168,67,0.18)",
              transition: "all 0.3s",
              transform: dot === stepNum ? "scale(1.35)" : "scale(1)",
              boxShadow: dot === stepNum
                ? "0 0 12px rgba(245,166,35,0.8)"
                : dot < stepNum
                  ? "0 0 8px rgba(212,168,67,0.6)"
                  : "none",
            }}
          />
        ))}
      </div>

      <h2 style={{
        fontFamily: "var(--fd)",
        fontSize: "clamp(22px, 5vw, 32px)",
        fontWeight: 700,
        color: "var(--cream)",
        lineHeight: 1.2,
        marginBottom: 8,
      }}>
        {title}
      </h2>

      <p style={{
        fontSize: 14,
        fontStyle: "italic",
        color: "var(--muted)",
        marginBottom: 28,
        lineHeight: 1.6,
      }}>
        {aside}
      </p>

      {children}

      {/* Nav buttons */}
      <div style={{ display: "flex", gap: 9, marginTop: 24 }}>
        <button
          onClick={onBack}
          style={{
            padding: "13px 20px",
            background: "transparent",
            border: "1.5px solid rgba(212,168,67,0.2)",
            borderRadius: 8,
            color: "var(--dim)",
            fontFamily: "var(--fd)",
            fontSize: 10,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          &larr; Back
        </button>
        <button
          onClick={onNext}
          disabled={!canContinue}
          style={{
            flex: 1,
            padding: 14,
            background: canContinue
              ? "linear-gradient(135deg, var(--amber), var(--amber2))"
              : "rgba(212,168,67,0.15)",
            border: "none",
            borderRadius: 8,
            color: canContinue ? "var(--bg)" : "var(--dim)",
            fontFamily: "var(--fd)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            cursor: canContinue ? "pointer" : "not-allowed",
            transition: "all 0.18s",
            boxShadow: canContinue ? "0 6px 24px rgba(245,166,35,0.3)" : "none",
            opacity: canContinue ? 1 : 0.35,
          }}
        >
          {nextLabel} &rarr;
        </button>
      </div>
    </div>
  )
}

// ── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 28,
      animation: "fadeSlideIn 0.45s ease-out both",
    }}>
      <div
        style={{ animation: "scalesway 1.4s ease-in-out infinite" }}
        dangerouslySetInnerHTML={{ __html: LoadingScalesSVG }}
      />
      <div style={{
        fontFamily: "var(--fd)",
        fontSize: 13,
        letterSpacing: ".14em",
        textTransform: "uppercase",
        color: "var(--gold)",
        animation: "lpulse 1.6s ease-in-out infinite",
      }}>
        Consulting the scales
      </div>
      <div style={{
        fontSize: 13,
        fontStyle: "italic",
        color: "var(--dim)",
        textAlign: "center",
        maxWidth: 280,
        lineHeight: 1.7,
        animation: "lpulse 2.2s ease-in-out 0.4s infinite",
      }}>
        &#8220;Patience, friend. The market does not reveal itself in haste.&#8221;
      </div>
    </div>
  )
}

// ── Shared input style ───────────────────────────────────────────────────────
const soukInputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(26,15,6,0.8)",
  border: "1.5px solid rgba(212,168,67,0.28)",
  borderRadius: 10,
  color: "var(--cream)",
  fontFamily: "var(--fb)",
  fontSize: 15,
  padding: "14px 16px",
  outline: "none",
  minHeight: undefined,
  resize: "vertical" as const,
  lineHeight: 1.6,
}
