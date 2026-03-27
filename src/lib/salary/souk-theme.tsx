// ── Shared Souk Theme Components ─────────────────────────────────────────────
// Used by both SalaryNegotiator and SalaryResult to avoid duplication.

import React from "react"
import { Lora, Cinzel } from "next/font/google"

const lora = Lora({ variable: "--font-lora", subsets: ["latin"] })
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"] })

// ── CSS custom properties + keyframes (injected once per page) ───────────────
export const soukStyles = `
:root {
  --souk-bg: #0C0804;
  --souk-bg2: #1A0F06;
  --souk-amber: #F5A623;
  --souk-amber2: #C47D0E;
  --souk-teal: #3ABCBD;
  --souk-teal2: #1A7172;
  --souk-cream: #F0E4C4;
  --souk-cream2: #D4C49A;
  --souk-red: #C23B22;
  --souk-gold: #D4A843;
  --souk-gold2: #A07820;
  --souk-muted: rgba(240,228,196,0.45);
  --souk-dim: rgba(240,228,196,0.32);
}

@keyframes souk-fadeSlideIn {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes souk-scorepop {
  from { transform: scale(0.7); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes souk-secin {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes souk-sglow {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
@keyframes souk-lsw {
  0%, 100% { transform: rotate(-6deg); }
  50% { transform: rotate(6deg); }
}
@keyframes souk-scalesway {
  0%, 100% { transform: rotate(-8deg); }
  50% { transform: rotate(8deg); }
}
@keyframes souk-pulse {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.35; }
}
@keyframes souk-lpulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

/* ── Hover / Focus states (can't be done inline) ── */
.souk-cta:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 12px 40px rgba(245,166,35,0.45), 0 4px 12px rgba(245,166,35,0.25) !important;
}
.souk-cta:active { transform: translateY(0) !important; }

.souk-btn-next:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 30px rgba(245,166,35,0.4) !important;
}
.souk-btn-next:disabled { cursor: not-allowed; }

.souk-btn-back:hover {
  border-color: rgba(212,168,67,0.45) !important;
  color: var(--souk-muted) !important;
}

.souk-input:focus {
  border-color: var(--souk-amber) !important;
  box-shadow: 0 0 0 3px rgba(245,166,35,0.12), 0 0 20px rgba(245,166,35,0.08) !important;
  outline: none;
}

.souk-chip:hover {
  border-color: var(--souk-amber) !important;
  color: var(--souk-cream) !important;
  background: rgba(245,166,35,0.08) !important;
}

.souk-sit-card:hover {
  border-color: rgba(245,166,35,0.5) !important;
  background: rgba(245,166,35,0.06) !important;
}

.souk-copy-btn:hover {
  background: rgba(245,166,35,0.25) !important;
}

.souk-hat-link:hover {
  background: var(--souk-teal) !important;
  transform: translateY(-1px);
}

.souk-redo:hover {
  border-color: rgba(212,168,67,0.45) !important;
  color: var(--souk-muted) !important;
}

.souk-tab:hover {
  color: var(--souk-cream2) !important;
}

.souk-tier-head:hover {
  color: var(--souk-muted) !important;
}

/* Focus-visible for keyboard users */
.souk-cta:focus-visible,
.souk-btn-next:focus-visible,
.souk-btn-back:focus-visible,
.souk-chip:focus-visible,
.souk-sit-card:focus-visible,
.souk-copy-btn:focus-visible,
.souk-tab:focus-visible,
.souk-redo:focus-visible,
.souk-hat-link:focus-visible {
  outline: 2px solid var(--souk-amber);
  outline-offset: 2px;
}

/* Select dropdown option styling */
.souk-input option { background: #1A0F06; color: var(--souk-cream); }

/* Toggle switch */
.souk-toggle:focus-visible {
  outline: 2px solid var(--souk-amber);
  outline-offset: 2px;
}
`

// ── Arabesque background data URL ────────────────────────────────────────────
export const arabesqueBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M40 2 L78 40 L40 78 L2 40 Z' fill='none' stroke='rgba(212,168,67,0.07)' stroke-width='1'/%3E%3Cpath d='M40 14 L66 40 L40 66 L14 40 Z' fill='none' stroke='rgba(212,168,67,0.05)' stroke-width='1'/%3E%3Ccircle cx='40' cy='40' r='6' fill='none' stroke='rgba(212,168,67,0.06)' stroke-width='1'/%3E%3Ccircle cx='2' cy='2' r='2' fill='rgba(212,168,67,0.06)'/%3E%3Ccircle cx='78' cy='2' r='2' fill='rgba(212,168,67,0.06)'/%3E%3Ccircle cx='2' cy='78' r='2' fill='rgba(212,168,67,0.06)'/%3E%3Ccircle cx='78' cy='78' r='2' fill='rgba(212,168,67,0.06)'/%3E%3C/svg%3E")`

// ── Lantern data ─────────────────────────────────────────────────────────────
const LANTERN_DATA = [
  { rope: 20, dur: 2.6, delay: 0, svg: `<svg width="22" height="32" viewBox="0 0 22 32" fill="none"><rect x="3" y="4" width="16" height="22" rx="4" fill="#8A3010" opacity=".9"/><rect x="5" y="7" width="5" height="5" fill="#F5A623" opacity=".8" rx="1"/><rect x="12" y="7" width="5" height="5" fill="#F5A623" opacity=".8" rx="1"/><rect x="5" y="15" width="5" height="5" fill="#F5A623" opacity=".7" rx="1"/><rect x="12" y="15" width="5" height="5" fill="#F5A623" opacity=".7" rx="1"/><rect x="1" y="2" width="20" height="4" fill="#6A2008" rx="2"/><rect x="1" y="24" width="20" height="4" fill="#6A2008" rx="2"/><ellipse cx="11" cy="13" rx="18" ry="14" fill="#F5A623" opacity=".07"/></svg>` },
  { rope: 35, dur: 2.2, delay: 0.55, svg: `<svg width="26" height="38" viewBox="0 0 26 38" fill="none"><rect x="3" y="5" width="20" height="26" rx="5" fill="#1A5A3A" opacity=".9"/><rect x="5" y="9" width="7" height="6" fill="#F5A623" opacity=".8" rx="1"/><rect x="14" y="9" width="7" height="6" fill="#F5A623" opacity=".8" rx="1"/><rect x="5" y="18" width="7" height="6" fill="#F5A623" opacity=".7" rx="1"/><rect x="14" y="18" width="7" height="6" fill="#F5A623" opacity=".65" rx="1"/><rect x="1" y="3" width="24" height="4" fill="#0F3D26" rx="2"/><rect x="1" y="29" width="24" height="5" fill="#0F3D26" rx="2"/><ellipse cx="13" cy="18" rx="22" ry="17" fill="#F5A623" opacity=".08"/></svg>` },
  { rope: 15, dur: 3.0, delay: 0.2, svg: `<svg width="30" height="44" viewBox="0 0 30 44" fill="none"><rect x="3" y="5" width="24" height="32" rx="6" fill="#7A1A5A" opacity=".9"/><rect x="6" y="9" width="8" height="7" fill="#F5A623" opacity=".85" rx="1.5"/><rect x="16" y="9" width="8" height="7" fill="#F5A623" opacity=".85" rx="1.5"/><rect x="6" y="19" width="8" height="7" fill="#F5A623" opacity=".75" rx="1.5"/><rect x="16" y="19" width="8" height="7" fill="#F5A623" opacity=".75" rx="1.5"/><rect x="6" y="29" width="18" height="5" fill="#F5A623" opacity=".6" rx="1"/><rect x="1" y="3" width="28" height="5" fill="#5A0A3A" rx="2"/><rect x="1" y="35" width="28" height="6" fill="#5A0A3A" rx="2"/><ellipse cx="15" cy="20" rx="26" ry="20" fill="#F5A623" opacity=".1"/></svg>` },
  { rope: 28, dur: 2.4, delay: 0.85, svg: `<svg width="22" height="32" viewBox="0 0 22 32" fill="none"><rect x="3" y="4" width="16" height="22" rx="4" fill="#1A3A7A" opacity=".9"/><rect x="5" y="7" width="5" height="5" fill="#F5C040" opacity=".8" rx="1"/><rect x="12" y="7" width="5" height="5" fill="#F5C040" opacity=".8" rx="1"/><rect x="5" y="15" width="5" height="5" fill="#F5C040" opacity=".7" rx="1"/><rect x="12" y="15" width="5" height="5" fill="#F5C040" opacity=".7" rx="1"/><rect x="1" y="2" width="20" height="4" fill="#0A1E4A" rx="2"/><rect x="1" y="24" width="20" height="4" fill="#0A1E4A" rx="2"/><ellipse cx="11" cy="13" rx="18" ry="14" fill="#F5C040" opacity=".08"/></svg>` },
  { rope: 42, dur: 2.8, delay: 0.4, svg: `<svg width="24" height="36" viewBox="0 0 24 36" fill="none"><rect x="2" y="4" width="20" height="28" rx="5" fill="#8A5500" opacity=".9"/><rect x="5" y="8" width="6" height="6" fill="#F5A623" opacity=".85" rx="1"/><rect x="13" y="8" width="6" height="6" fill="#F5A623" opacity=".85" rx="1"/><rect x="5" y="17" width="6" height="6" fill="#F5A623" opacity=".75" rx="1"/><rect x="13" y="17" width="6" height="6" fill="#F5A623" opacity=".7" rx="1"/><rect x="1" y="2" width="22" height="4" fill="#5A3500" rx="2"/><rect x="1" y="30" width="22" height="5" fill="#5A3500" rx="2"/><ellipse cx="12" cy="18" rx="20" ry="16" fill="#F5A623" opacity=".09"/></svg>` },
  { rope: 22, dur: 2.1, delay: 1.1, svg: `<svg width="20" height="30" viewBox="0 0 20 30" fill="none"><rect x="2" y="4" width="16" height="20" rx="4" fill="#2A1A7A" opacity=".9"/><rect x="4" y="7" width="5" height="5" fill="#F5D040" opacity=".8" rx="1"/><rect x="11" y="7" width="5" height="5" fill="#F5D040" opacity=".8" rx="1"/><rect x="4" y="15" width="5" height="5" fill="#F5D040" opacity=".7" rx="1"/><rect x="11" y="15" width="5" height="5" fill="#F5D040" opacity=".65" rx="1"/><rect x="1" y="2" width="18" height="4" fill="#1A0A5A" rx="2"/><rect x="1" y="22" width="18" height="4" fill="#1A0A5A" rx="2"/><ellipse cx="10" cy="12" rx="16" ry="12" fill="#F5D040" opacity=".08"/></svg>` },
]

// ── Sssalem SVG ──────────────────────────────────────────────────────────────
export const SssalemSVG = `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="100" cy="188" rx="60" ry="8" fill="rgba(0,0,0,0.5)"/><path d="M68 120 Q65 160 55 188 L145 188 Q135 160 132 120 Z" fill="#4A2808"/><path d="M70 120 Q68 155 60 188 L100 188 Z" fill="#3A1E04" opacity=".5"/><path d="M80 125 Q78 155 72 182" stroke="#6A3810" stroke-width="1.5" opacity=".6"/><path d="M100 122 Q100 160 100 185" stroke="#6A3810" stroke-width="1.5" opacity=".4"/><path d="M120 125 Q122 155 128 182" stroke="#6A3810" stroke-width="1.5" opacity=".6"/><rect x="70" y="126" width="60" height="8" rx="4" fill="#8A5510"/><circle cx="100" cy="130" r="4" fill="#D4A843"/><path d="M75 115 Q60 120 52 135" stroke="#5A3008" stroke-width="10" stroke-linecap="round"/><path d="M125 115 Q140 120 148 135" stroke="#5A3008" stroke-width="10" stroke-linecap="round"/><line x1="52" y1="135" x2="148" y2="135" stroke="#D4A843" stroke-width="2.5"/><circle cx="100" cy="133" r="5" fill="#D4A843"/><line x1="65" y1="135" x2="65" y2="155" stroke="#D4A843" stroke-width="1.5"/><line x1="135" y1="135" x2="135" y2="148" stroke="#D4A843" stroke-width="1.5"/><ellipse cx="65" cy="158" rx="16" ry="5" fill="#C89030" opacity=".9"/><path d="M49 155 Q65 165 81 155" fill="#A87020" opacity=".7"/><ellipse cx="135" cy="151" rx="14" ry="4.5" fill="#C89030" opacity=".9"/><path d="M121 148 Q135 158 149 148" fill="#A87020" opacity=".7"/><circle cx="60" cy="153" r="4" fill="#D4A843"/><circle cx="68" cy="154" r="3.5" fill="#C89030"/><circle cx="64" cy="150" r="3" fill="#D4A843"/><path d="M72 95 Q68 115 70 122 L130 122 Q132 115 128 95 Z" fill="#5A3010"/><path d="M90 95 L100 120 L110 95" stroke="#8A5520" stroke-width="2" fill="none"/><circle cx="100" cy="72" r="26" fill="#8A6040"/><ellipse cx="94" cy="74" rx="3" ry="3.5" fill="#2A1A08"/><ellipse cx="106" cy="74" rx="3" ry="3.5" fill="#2A1A08"/><ellipse cx="93.5" cy="73.5" rx="1.2" ry="1.5" fill="white" opacity=".9"/><ellipse cx="105.5" cy="73.5" rx="1.2" ry="1.5" fill="white" opacity=".9"/><path d="M92 82 Q100 88 108 82" stroke="#5A3820" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M90 68 Q94 66 98 68" stroke="#4A2A10" stroke-width="2" stroke-linecap="round"/><path d="M102 68 Q106 66 110 68" stroke="#4A2A10" stroke-width="2" stroke-linecap="round"/><path d="M88 86 Q100 98 112 86 Q108 95 100 98 Q92 95 88 86 Z" fill="#5A3818"/><ellipse cx="100" cy="58" rx="28" ry="16" fill="#2A6888"/><path d="M72 58 Q75 44 100 42 Q125 44 128 58" fill="#1A4A66"/><path d="M74 56 Q85 48 100 46 Q115 48 126 56" stroke="#3A88AA" stroke-width="2.5" fill="none" opacity=".6"/><path d="M76 62 Q88 68 100 66 Q112 68 124 62" stroke="#3A88AA" stroke-width="2" fill="none" opacity=".4"/><circle cx="100" cy="50" r="5" fill="#D4A843"/><circle cx="100" cy="50" r="3" fill="#F5C040"/><path d="M72 60 Q65 68 68 76 Q72 80 75 76 Q73 70 76 66 Q78 62 72 60 Z" fill="#1A4A66"/><rect x="35" y="165" width="14" height="18" rx="3" fill="#6A3010" opacity=".8"/><ellipse cx="42" cy="165" rx="8" ry="4" fill="#8A4018" opacity=".9"/><ellipse cx="42" cy="163" rx="6" ry="2.5" fill="#C86020" opacity=".9"/><rect x="150" y="168" width="16" height="14" rx="2" fill="#D4C490" opacity=".7"/><ellipse cx="158" cy="168" rx="9" ry="4" fill="#C4B478" opacity=".8"/><ellipse cx="158" cy="182" rx="9" ry="4" fill="#C4B478" opacity=".8"/><ellipse cx="100" cy="140" rx="50" ry="18" fill="#F5A623" opacity=".04"/></svg>`

// ── Loading scales SVG ───────────────────────────────────────────────────────
export const LoadingScalesSVG = `<svg width="80" height="60" viewBox="0 0 80 60" fill="none"><line x1="10" y1="28" x2="70" y2="28" stroke="#D4A843" stroke-width="2.5"/><circle cx="40" cy="26" r="5" fill="#D4A843"/><line x1="22" y1="28" x2="22" y2="44" stroke="#D4A843" stroke-width="1.5"/><line x1="58" y1="28" x2="58" y2="38" stroke="#D4A843" stroke-width="1.5"/><ellipse cx="22" cy="46" rx="14" ry="4" fill="#C89030" opacity=".9"/><ellipse cx="58" cy="40" rx="12" ry="3.5" fill="#C89030" opacity=".9"/><circle cx="18" cy="42" r="3" fill="#D4A843"/><circle cx="25" cy="43" r="2.5" fill="#C89030"/><circle cx="22" cy="40" r="2" fill="#D4A843"/><line x1="40" y1="0" x2="40" y2="22" stroke="#C89030" stroke-width="2"/></svg>`

// ── Shared input style ───────────────────────────────────────────────────────
export const soukInputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(26,15,6,0.8)",
  border: "1.5px solid rgba(212,168,67,0.28)",
  borderRadius: 10,
  color: "var(--souk-cream)",
  fontFamily: "var(--font-lora), serif",
  fontSize: 15,
  padding: "14px 16px",
  outline: "none",
  lineHeight: 1.6,
}

// ── Souk Page Shell ──────────────────────────────────────────────────────────
// Wraps content with arabesque bg, ambient glow, lanterns, and hat footer.
export function SoukShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${lora.variable} ${cinzel.variable}`}
      style={{
        background: "var(--souk-bg)",
        color: "var(--souk-cream)",
        fontFamily: "var(--font-lora), serif",
        minHeight: "100dvh",
        width: "100%",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: soukStyles }} />

      {/* Arabesque background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: arabesqueBg, pointerEvents: "none" }} />

      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: "-20%", left: "50%", transform: "translateX(-50%)",
        width: "min(700px, 100vw)", height: 400,
        background: "radial-gradient(ellipse, rgba(212,168,67,0.12) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Lanterns */}
      <Lanterns />

      {children}

      {/* Hat footer */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(12,8,4,0.95)",
        borderTop: "1px solid rgba(212,168,67,0.12)",
        padding: "9px 20px",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <a
          href="https://shop.randomorium.ai"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 11, color: "var(--souk-dim)", textDecoration: "none",
            fontFamily: "var(--font-cinzel), serif", letterSpacing: ".06em",
          }}
        >
          Part of <span style={{ color: "var(--souk-teal)" }}>randomorium.ai</span> &middot; Buy a hat &rarr;
        </a>
      </div>
    </div>
  )
}

// ── Lanterns ──────────────────────────────────────────────────────────────────
function Lanterns() {
  return (
    <div aria-hidden="true" style={{
      position: "fixed", top: 0, left: 0, right: 0, height: 80,
      zIndex: 20, pointerEvents: "none",
      display: "flex", alignItems: "flex-start", justifyContent: "space-around",
    }}>
      {LANTERN_DATA.map((l, i) => (
        <div
          key={i}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            animation: `souk-lsw ${l.dur}s ease-in-out ${l.delay}s infinite`,
            transformOrigin: "top center",
          }}
        >
          <div style={{ width: 1.5, height: l.rope, background: "rgba(212,168,67,0.5)" }} />
          <div dangerouslySetInnerHTML={{ __html: l.svg }} />
        </div>
      ))}
    </div>
  )
}

// ── Ornament divider ─────────────────────────────────────────────────────────
export function Ornament({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }} role="presentation">
      <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, rgba(212,168,67,0.5), transparent)" }} />
      <span style={{
        fontFamily: "var(--font-cinzel), serif", fontSize: 9, letterSpacing: ".2em",
        textTransform: "uppercase", color: "var(--souk-gold)", opacity: 0.7,
      }}>
        {text}
      </span>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, rgba(212,168,67,0.5), transparent)" }} />
    </div>
  )
}

// ── Progress Dots ────────────────────────────────────────────────────────────
export function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 40 }}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Step ${current} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => i + 1).map((dot) => (
        <div
          key={dot}
          style={{
            width: 8, height: 8, borderRadius: "50%",
            background: dot < current ? "var(--souk-gold)" : dot === current ? "var(--souk-amber)" : "rgba(212,168,67,0.18)",
            transition: "all 0.3s",
            transform: dot === current ? "scale(1.35)" : "scale(1)",
            boxShadow: dot === current ? "0 0 12px rgba(245,166,35,0.8)" : dot < current ? "0 0 8px rgba(212,168,67,0.6)" : "none",
          }}
        />
      ))}
    </div>
  )
}
