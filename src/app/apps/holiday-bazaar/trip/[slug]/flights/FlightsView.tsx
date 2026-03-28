"use client";

import { useEffect, useState } from "react";
import type { FlightResult, MemberFlight } from "@/lib/holiday-bazaar/types";
import { supabase } from "@/lib/holiday-bazaar/supabase";
import type { MemberWithAvailability } from "@/lib/holiday-bazaar/types";

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#0D0800",
  surface: "rgba(255, 255, 255, 0.04)",
  border: "rgba(255, 255, 255, 0.09)",
  amber: "#F0B429",
  amberDim: "rgba(240, 180, 40, 0.12)",
  amberBorder: "rgba(240, 180, 40, 0.25)",
  green: "#4ADE80",
  greenDim: "rgba(74, 222, 128, 0.10)",
  greenBorder: "rgba(74, 222, 128, 0.25)",
  cream: "#F0E8D5",
  text: "rgba(255, 255, 255, 0.88)",
  muted: "rgba(255, 255, 255, 0.42)",
  danger: "#E85D5D",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatPrice(n: number): string {
  return `£${n.toFixed(0)}`;
}

function valueLabelStyle(label: FlightResult["value_label"]): {
  bg: string;
  border: string;
  color: string;
  text: string;
} {
  if (label === "great")
    return {
      bg: C.greenDim,
      border: C.greenBorder,
      color: C.green,
      text: "Great value",
    };
  if (label === "good")
    return {
      bg: C.amberDim,
      border: C.amberBorder,
      color: C.amber,
      text: "Good value",
    };
  return {
    bg: C.surface,
    border: C.border,
    color: C.muted,
    text: "Standard",
  };
}

// ── Member flight row ─────────────────────────────────────────────────────────

function MemberFlightRow({
  flight,
  memberName,
}: {
  flight: MemberFlight;
  memberName: string;
}) {
  return (
    <div
      style={{
        padding: "0.75rem 0",
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
      }}
    >
      {/* Member name + AL days + price */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "0.85rem",
            fontWeight: 600,
            color: C.cream,
          }}
        >
          {memberName}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span
            style={{
              fontSize: "0.7rem",
              fontFamily: "var(--font-geist-mono)",
              color: C.muted,
            }}
          >
            {flight.al_days_used === 0
              ? "no AL"
              : `${flight.al_days_used} AL day${flight.al_days_used === 1 ? "" : "s"}`}
          </span>
          <span
            style={{
              fontSize: "0.875rem",
              fontWeight: 700,
              color: C.amber,
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            {formatPrice(flight.price_gbp)}
          </span>
        </div>
      </div>

      {/* Outbound */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.75rem",
          color: C.muted,
          fontFamily: "var(--font-geist-mono)",
        }}
      >
        <span style={{ color: C.text }}>
          {flight.outbound.departure_iata} → {flight.outbound.arrival_iata}
        </span>
        <span>·</span>
        <span>{formatTime(flight.outbound.departure_time)}</span>
        <span>→</span>
        <span>{formatTime(flight.outbound.arrival_time)}</span>
        <span>·</span>
        <span>{flight.outbound.flight_number}</span>
      </div>

      {/* Inbound */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.75rem",
          color: C.muted,
          fontFamily: "var(--font-geist-mono)",
        }}
      >
        <span style={{ color: C.text }}>
          {flight.inbound.departure_iata} → {flight.inbound.arrival_iata}
        </span>
        <span>·</span>
        <span>{formatTime(flight.inbound.departure_time)}</span>
        <span>→</span>
        <span>{formatTime(flight.inbound.arrival_time)}</span>
        <span>·</span>
        <span>{flight.inbound.flight_number}</span>
      </div>
    </div>
  );
}

// ── Destination card ──────────────────────────────────────────────────────────

function DestinationCard({
  result,
  members,
  rank,
}: {
  result: FlightResult;
  members: MemberWithAvailability[];
  rank: number;
}) {
  const [expanded, setExpanded] = useState(rank === 0);
  const vStyle = valueLabelStyle(result.value_label);
  const isTop = rank === 0;

  return (
    <div
      style={{
        background: isTop ? C.amberDim : C.surface,
        border: `1px solid ${isTop ? C.amberBorder : C.border}`,
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      {/* Card header — always visible */}
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          padding: "1rem 1.25rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          gap: "0.75rem",
        }}
      >
        {/* Flag + rank */}
        <div
          style={{
            fontSize: "2rem",
            lineHeight: 1,
            flexShrink: 0,
            position: "relative",
          }}
        >
          {result.destination_flag}
          {isTop && (
            <div
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: C.amber,
                fontSize: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0D0800",
                fontWeight: 700,
              }}
            >
              ★
            </div>
          )}
        </div>

        {/* Destination info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "0.4rem",
              marginBottom: "0.2rem",
            }}
          >
            <span
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: C.cream,
              }}
            >
              {result.destination_name}
            </span>
            <span style={{ fontSize: "0.75rem", color: C.muted }}>
              {result.destination_country}
            </span>
          </div>
          <div
            style={{
              fontSize: "0.72rem",
              color: C.muted,
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            {formatDate(result.window_start)} → {formatDate(result.window_end)}
          </div>
        </div>

        {/* Price + value badge */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "0.3rem",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: C.amber,
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            {formatPrice(result.total_cost_gbp)}
          </span>
          <div
            style={{
              padding: "0.15rem 0.5rem",
              background: vStyle.bg,
              border: `1px solid ${vStyle.border}`,
              borderRadius: "100px",
              fontSize: "0.6rem",
              fontFamily: "var(--font-geist-mono)",
              color: vStyle.color,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {vStyle.text}
          </div>
        </div>

        {/* Chevron */}
        <span
          style={{
            color: C.muted,
            fontSize: "0.75rem",
            flexShrink: 0,
            transition: "transform 0.2s",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▾
        </span>
      </button>

      {/* Expanded: per-member flights */}
      {expanded && (
        <div
          style={{
            padding: "0 1.25rem 1.25rem",
            borderTop: `1px solid ${C.border}`,
          }}
        >
          {/* AL efficiency */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.6rem 0",
              fontSize: "0.75rem",
              color: C.muted,
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            <span>AL efficiency:</span>
            <span style={{ color: C.cream, fontWeight: 600 }}>
              {result.al_efficiency_score.toFixed(1)} nights / day
            </span>
          </div>

          {/* Per-member rows */}
          <div>
            {result.per_member_flights.map((mf) => {
              const member = members.find((m) => m.id === mf.member_id);
              return (
                <MemberFlightRow
                  key={mf.member_id}
                  flight={mf}
                  memberName={member?.name ?? "Unknown"}
                />
              );
            })}
          </div>

          {/* Total + book */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: "0.875rem",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.65rem",
                  fontFamily: "var(--font-geist-mono)",
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "0.15rem",
                }}
              >
                Total group cost
              </div>
              <div
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: C.amber,
                  fontFamily: "var(--font-geist-mono)",
                }}
              >
                {formatPrice(result.total_cost_gbp)}
              </div>
            </div>

            <a
              href={`https://www.google.com/flights?q=flights+to+${result.destination_name}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "0.65rem 1.25rem",
                background: C.amber,
                color: "#0D0800",
                fontFamily: "var(--font-geist-mono)",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                borderRadius: "100px",
                textDecoration: "none",
                minHeight: "40px",
                display: "flex",
                alignItems: "center",
              }}
            >
              Search flights →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FlightsView({
  slug,
  windowStart,
  windowEnd,
}: {
  slug: string;
  windowStart: string;
  windowEnd: string;
}) {
  const [results, setResults] = useState<FlightResult[]>([]);
  const [members, setMembers] = useState<MemberWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!windowStart || !windowEnd) {
        setError("No date window selected.");
        setLoading(false);
        return;
      }
      // Fetch members for name lookups
      const { data: membersData } = await supabase
        .from("members")
        .select("*, date_ranges(*)")
        .eq("trip_id", slug)
        .order("joined_at", { ascending: true });

      setMembers((membersData as MemberWithAvailability[]) ?? []);

      // Fetch flight results
      const res = await fetch(
        `/api/holiday-bazaar/flights?trip_id=${slug}&window_start=${windowStart}&window_end=${windowEnd}`,
      );

      if (!res.ok) {
        setError("Couldn't load flight results. Try again.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setResults(data.results ?? []);
      setLoading(false);
    }

    if (windowStart && windowEnd) {
      load();
    } else {
      load();
    }
  }, [slug, windowStart, windowEnd]);

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: C.bg,
          gap: "1rem",
        }}
      >
        <div style={{ fontSize: "2.5rem" }}>✈️</div>
        <p
          style={{
            fontSize: "0.875rem",
            color: C.muted,
            fontFamily: "var(--font-geist-mono)",
          }}
        >
          Checking 50 destinations…
        </p>
        <p
          style={{
            fontSize: "0.75rem",
            color: C.muted,
            opacity: 0.6,
            fontStyle: "italic",
          }}
        >
          Sssalem is negotiating the best routes.
        </p>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div
        style={{
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: C.bg,
          padding: "2rem",
          textAlign: "center",
          gap: "1rem",
        }}
      >
        <div style={{ fontSize: "2.5rem" }}>🐍</div>
        <p style={{ fontSize: "0.9rem", color: C.danger }}>{error}</p>
        <a
          href={`/apps/holiday-bazaar/trip/${slug}`}
          style={{
            fontSize: "0.8rem",
            fontFamily: "var(--font-geist-mono)",
            color: C.amber,
            textDecoration: "none",
          }}
        >
          ← Back to trip
        </a>
      </div>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────────

  const dateLabel = windowStart
    ? `${new Date(windowStart).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} → ${new Date(windowEnd).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
    : "";

  return (
    <div
      style={{
        minHeight: "100svh",
        background: `radial-gradient(ellipse 80% 40% at 50% 0%, rgba(240,180,40,0.08) 0%, transparent 60%), ${C.bg}`,
        color: C.text,
        fontFamily: "var(--font-geist-sans)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "1.25rem 1.25rem 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: "480px",
          margin: "0 auto",
        }}
      >
        <a
          href={`/apps/holiday-bazaar/trip/${slug}`}
          style={{
            fontSize: "0.8rem",
            fontFamily: "var(--font-geist-mono)",
            color: C.muted,
            textDecoration: "none",
            letterSpacing: "0.05em",
          }}
        >
          ← trip
        </a>
        <span
          style={{
            fontSize: "0.65rem",
            fontFamily: "var(--font-geist-mono)",
            color: C.muted,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {dateLabel}
        </span>
      </div>

      <div
        style={{
          maxWidth: "480px",
          margin: "0 auto",
          padding: "1.5rem 1.25rem 6rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {/* Hero */}
        <div>
          <p
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.65rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: C.amber,
              opacity: 0.8,
              marginBottom: "0.4rem",
            }}
          >
            ✈️ flight options
          </p>
          <h1
            style={{
              fontSize: "clamp(1.5rem, 6vw, 2rem)",
              fontWeight: 700,
              color: C.cream,
              lineHeight: 1.2,
              marginBottom: "0.4rem",
            }}
          >
            Where could you go?
          </h1>
          <p style={{ fontSize: "0.875rem", color: C.muted, lineHeight: 1.5 }}>
            {results.length} destinations found · sorted by total group cost
          </p>
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            fontSize: "0.7rem",
            fontFamily: "var(--font-geist-mono)",
          }}
        >
          {(
            [
              {
                label: "great",
                text: "Great value",
                color: C.green,
                bg: C.greenDim,
                border: C.greenBorder,
              },
              {
                label: "good",
                text: "Good value",
                color: C.amber,
                bg: C.amberDim,
                border: C.amberBorder,
              },
              {
                label: "standard",
                text: "Standard",
                color: C.muted,
                bg: C.surface,
                border: C.border,
              },
            ] as const
          ).map((v) => (
            <div
              key={v.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "0.2rem 0.6rem",
                background: v.bg,
                border: `1px solid ${v.border}`,
                borderRadius: "100px",
                color: v.color,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {v.text}
            </div>
          ))}
        </div>

        {/* Results list */}
        {results.length === 0 ? (
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "14px",
              padding: "1.5rem",
              textAlign: "center",
            }}
          >
            <p
              style={{ fontSize: "0.875rem", color: C.muted, lineHeight: 1.6 }}
            >
              No destinations found for this window. Try a different date range.
            </p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {results.map((r, i) => (
              <DestinationCard
                key={r.destination_iata}
                result={r}
                members={members}
                rank={i}
              />
            ))}
          </div>
        )}

        {/* Hat banner */}
        <a
          href="https://shop.randomorium.ai"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "0.72rem",
            color: C.muted,
            textDecoration: "none",
            borderTop: `1px solid ${C.border}`,
            paddingTop: "1rem",
            textAlign: "center",
          }}
        >
          Part of randomorium.ai &nbsp;·&nbsp;{" "}
          <span style={{ color: C.amber }}>Buy a travel hat →</span>
        </a>
      </div>
    </div>
  );
}
