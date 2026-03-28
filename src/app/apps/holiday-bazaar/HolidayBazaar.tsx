"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ── Palette — matches the souk dark theme ────────────────────────────────────
const C = {
  bg: "#0D0800",
  surface: "rgba(255, 255, 255, 0.04)",
  surfaceHover: "rgba(255, 255, 255, 0.07)",
  border: "rgba(255, 255, 255, 0.09)",
  borderActive: "rgba(240, 180, 40, 0.6)",
  amber: "#F0B429",
  amberDim: "rgba(240, 180, 40, 0.15)",
  cream: "#F0E8D5",
  text: "rgba(255, 255, 255, 0.88)",
  muted: "rgba(255, 255, 255, 0.42)",
  danger: "#E85D5D",
};

type Screen = "landing" | "new-trip" | "creating";

function saveGuestSession(memberId: string, tripId: string) {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  localStorage.setItem(
    `hb_session_${tripId}`,
    JSON.stringify({
      member_id: memberId,
      trip_id: tripId,
      expires_at: expires.toISOString(),
    }),
  );
}

// ── Landing screen ───────────────────────────────────────────────────────────

function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100svh",
        padding: "2rem 1.5rem 4rem",
        textAlign: "center",
        background: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(240,180,40,0.12) 0%, transparent 70%), ${C.bg}`,
      }}
    >
      {/* Lanterns */}
      <div
        style={{ fontSize: "2.5rem", marginBottom: "1.5rem", lineHeight: 1 }}
      >
        🏮 🎩 🏮
      </div>

      {/* Eyebrow */}
      <p
        style={{
          fontFamily: "var(--font-geist-mono)",
          fontSize: "0.65rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: C.amber,
          opacity: 0.8,
          marginBottom: "1rem",
        }}
      >
        randomorium.ai · the bazaar
      </p>

      {/* Headline */}
      <h1
        style={{
          fontSize: "clamp(2rem, 8vw, 3rem)",
          fontWeight: 700,
          color: C.cream,
          lineHeight: 1.15,
          marginBottom: "0.75rem",
          letterSpacing: "-0.02em",
          maxWidth: "16ch",
        }}
      >
        Stop texting.
        <br />
        Start packing.
      </h1>

      {/* Sub */}
      <p
        style={{
          fontSize: "1rem",
          color: C.muted,
          lineHeight: 1.6,
          maxWidth: "30ch",
          marginBottom: "2.5rem",
        }}
      >
        Find dates that work for the whole group. Let the flights decide where
        you go.
      </p>

      {/* CTA */}
      <button
        onClick={onStart}
        style={{
          padding: "0.9rem 2.5rem",
          background: C.amber,
          color: "#0D0800",
          fontFamily: "var(--font-geist-mono)",
          fontSize: "0.8rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          border: "none",
          borderRadius: "100px",
          cursor: "pointer",
          boxShadow: `0 0 32px rgba(240,180,40,0.35)`,
          transition: "transform 0.15s, box-shadow 0.15s",
          minHeight: "52px",
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform =
            "scale(1.04)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            `0 0 48px rgba(240,180,40,0.5)`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            `0 0 32px rgba(240,180,40,0.35)`;
        }}
      >
        Plan a trip →
      </button>

      {/* Sssalem flavour */}
      <p
        style={{
          marginTop: "2rem",
          fontSize: "0.8rem",
          color: C.muted,
          fontStyle: "italic",
          maxWidth: "28ch",
          lineHeight: 1.5,
        }}
      >
        &ldquo;Every great journey ssstarts with a group chat that gets out of
        hand.&rdquo;
        <br />
        <span style={{ fontSize: "0.72rem", opacity: 0.6 }}>
          — Sssalem, snake charmer & travel consultant
        </span>
      </p>

      {/* Hat banner inline */}
      <a
        href="https://shop.randomorium.ai"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: "3rem",
          fontSize: "0.72rem",
          color: C.muted,
          textDecoration: "none",
          borderTop: `1px solid ${C.border}`,
          paddingTop: "1rem",
          width: "100%",
          maxWidth: "320px",
          display: "block",
          textAlign: "center",
        }}
      >
        Part of randomorium.ai &nbsp;·&nbsp;{" "}
        <span style={{ color: C.amber }}>Buy a travel hat →</span>
      </a>
    </div>
  );
}

// ── New trip form ────────────────────────────────────────────────────────────

function NewTripScreen({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [tripName, setTripName] = useState("");
  const [yourName, setYourName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = tripName.trim().length > 0 && yourName.trim().length > 0;

  async function handleCreate() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/holiday-bazaar/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip_name: tripName, organiser_name: yourName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        setLoading(false);
        return;
      }

      saveGuestSession(data.member_id, data.trip_id);
      router.push(`/apps/holiday-bazaar/trip/${data.trip_id}`);
    } catch {
      setError("Couldn't reach the bazaar. Check your connection.");
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.85rem 1rem",
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    color: C.text,
    fontSize: "1rem",
    fontFamily: "var(--font-geist-sans)",
    outline: "none",
    transition: "border-color 0.15s",
    minHeight: "48px",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-geist-mono)",
    fontSize: "0.65rem",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: C.muted,
    marginBottom: "0.5rem",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100svh",
        padding: "2rem 1.5rem 4rem",
        background: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(240,180,40,0.10) 0%, transparent 70%), ${C.bg}`,
      }}
    >
      <div style={{ width: "100%", maxWidth: "380px" }}>
        {/* Back */}
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: C.muted,
            fontSize: "0.8rem",
            cursor: "pointer",
            padding: "0 0 1.5rem",
            fontFamily: "var(--font-geist-mono)",
            letterSpacing: "0.05em",
          }}
        >
          ← back
        </button>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <p
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.65rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: C.amber,
              opacity: 0.8,
              marginBottom: "0.5rem",
            }}
          >
            new trip
          </p>
          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: C.cream,
              lineHeight: 1.2,
              marginBottom: "0.5rem",
            }}
          >
            Name your adventure
          </h2>
          <p style={{ fontSize: "0.875rem", color: C.muted, lineHeight: 1.5 }}>
            You&apos;ll get a link to share with the group.
          </p>
        </div>

        {/* Form */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {/* Trip name */}
          <div>
            <label style={labelStyle}>Trip name</label>
            <input
              type="text"
              placeholder="e.g. Summer lads trip"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = C.borderActive)
              }
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
              style={inputStyle}
              maxLength={60}
              autoFocus
            />
          </div>

          {/* Your name */}
          <div>
            <label style={labelStyle}>Your name</label>
            <input
              type="text"
              placeholder="e.g. Harry"
              value={yourName}
              onChange={(e) => setYourName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = C.borderActive)
              }
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
              style={inputStyle}
              maxLength={40}
            />
          </div>

          {/* Error */}
          {error && (
            <p style={{ fontSize: "0.8rem", color: C.danger, margin: 0 }}>
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={!canSubmit || loading}
            style={{
              width: "100%",
              padding: "0.9rem",
              background:
                canSubmit && !loading ? C.amber : "rgba(240,180,40,0.25)",
              color: canSubmit && !loading ? "#0D0800" : "rgba(240,180,40,0.5)",
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              border: "none",
              borderRadius: "12px",
              cursor: canSubmit && !loading ? "pointer" : "not-allowed",
              transition: "background 0.15s, color 0.15s",
              minHeight: "56px",
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
            }}
          >
            {loading ? "Opening the bazaar…" : "Create trip →"}
          </button>

          <p
            style={{
              fontSize: "0.72rem",
              color: C.muted,
              textAlign: "center",
              lineHeight: 1.5,
              opacity: 0.7,
            }}
          >
            No account needed. You&apos;ll get a link to share.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function HolidayBazaar() {
  const [screen, setScreen] = useState<Screen>("landing");

  if (screen === "landing") {
    return <LandingScreen onStart={() => setScreen("new-trip")} />;
  }

  return <NewTripScreen onBack={() => setScreen("landing")} />;
}
