"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/holiday-bazaar/supabase";
import type {
  Trip,
  MemberWithAvailability,
  GuestSession,
  DateWindow,
} from "@/lib/holiday-bazaar/types";
import {
  scoreWindows,
  formatWindowDates,
  windowNightsLabel,
} from "@/lib/holiday-bazaar/scoring";

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#0D0800",
  surface: "rgba(255, 255, 255, 0.04)",
  surfaceHover: "rgba(255, 255, 255, 0.07)",
  border: "rgba(255, 255, 255, 0.09)",
  borderActive: "rgba(240, 180, 40, 0.6)",
  amber: "#F0B429",
  amberDim: "rgba(240, 180, 40, 0.12)",
  green: "#4ADE80",
  greenDim: "rgba(74, 222, 128, 0.12)",
  cream: "#F0E8D5",
  text: "rgba(255, 255, 255, 0.88)",
  muted: "rgba(255, 255, 255, 0.42)",
  subtle: "rgba(255, 255, 255, 0.18)",
  danger: "#E85D5D",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGuestSession(tripId: string): GuestSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`hb_session_${tripId}`);
    if (!raw) return null;
    const session: GuestSession = JSON.parse(raw);
    if (new Date(session.expires_at) < new Date()) {
      localStorage.removeItem(`hb_session_${tripId}`);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function hasSubmittedAvailability(member: MemberWithAvailability): boolean {
  return (
    member.date_ranges.length > 0 &&
    member.al_budget !== null &&
    member.departure_airports.length > 0
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({
  name,
  isYou,
  hasAvailability,
}: {
  name: string;
  isYou: boolean;
  hasAvailability: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.4rem",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: isYou ? C.amberDim : C.surface,
          border: `2px solid ${isYou ? C.amber : hasAvailability ? C.green : C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.75rem",
          fontWeight: 700,
          color: isYou ? C.amber : hasAvailability ? C.green : C.muted,
          fontFamily: "var(--font-geist-mono)",
          flexShrink: 0,
          position: "relative",
        }}
      >
        {getInitials(name)}
        {hasAvailability && (
          <span
            style={{
              position: "absolute",
              bottom: "-2px",
              right: "-2px",
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: C.green,
              border: `2px solid ${C.bg}`,
            }}
          />
        )}
      </div>
      <span
        style={{
          fontSize: "0.65rem",
          color: isYou ? C.amber : C.muted,
          fontFamily: "var(--font-geist-mono)",
          maxWidth: "52px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textAlign: "center",
        }}
      >
        {isYou ? "you" : name.split(" ")[0]}
      </span>
    </div>
  );
}

// ── Share sheet ───────────────────────────────────────────────────────────────

function ShareSheet({
  tripId,
  tripName,
  onClose,
}: {
  tripId: string;
  tripName: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const url = `${typeof window !== "undefined" ? window.location.origin : "https://randomorium.ai"}/apps/holiday-bazaar/trip/${tripId}`;
  const waText = encodeURIComponent(
    `You're invited to plan *${tripName}* 🏖️\nAdd your dates here: ${url}`,
  );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the text
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      await navigator.share({
        title: tripName,
        text: `Join ${tripName} on Holiday Bazaar`,
        url,
      });
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 100,
        padding: "0 0 env(safe-area-inset-bottom, 0)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1A1200",
          border: `1px solid ${C.border}`,
          borderRadius: "20px 20px 0 0",
          padding: "1.5rem 1.5rem 2rem",
          width: "100%",
          maxWidth: "480px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div
          style={{
            width: "36px",
            height: "4px",
            borderRadius: "2px",
            background: C.border,
            margin: "0 auto 1.5rem",
          }}
        />

        <p
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: "0.65rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: C.amber,
            marginBottom: "0.5rem",
          }}
        >
          invite the group
        </p>
        <h3
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: C.cream,
            marginBottom: "1.5rem",
          }}
        >
          Share {tripName}
        </h3>

        {/* Link preview */}
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: "10px",
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            fontSize: "0.75rem",
            color: C.muted,
            fontFamily: "var(--font-geist-mono)",
            wordBreak: "break-all",
          }}
        >
          {url}
        </div>

        {/* Actions */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          {/* Copy link */}
          <button
            onClick={copyLink}
            style={{
              width: "100%",
              padding: "0.85rem",
              background: copied ? C.greenDim : C.amberDim,
              border: `1px solid ${copied ? C.green : C.borderActive}`,
              borderRadius: "12px",
              color: copied ? C.green : C.amber,
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              minHeight: "48px",
              transition: "all 0.15s",
            }}
          >
            {copied ? "✓ Copied!" : "Copy link"}
          </button>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              width: "100%",
              padding: "0.85rem",
              background: "rgba(37, 211, 102, 0.1)",
              border: "1px solid rgba(37, 211, 102, 0.3)",
              borderRadius: "12px",
              color: "#25D366",
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textAlign: "center",
              textDecoration: "none",
              minHeight: "48px",
              lineHeight: "28px",
              boxSizing: "border-box",
            }}
          >
            Share on WhatsApp
          </a>

          {/* Native share (mobile) */}
          {typeof window !== "undefined" && navigator.share && (
            <button
              onClick={nativeShare}
              style={{
                width: "100%",
                padding: "0.85rem",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: "12px",
                color: C.muted,
                fontFamily: "var(--font-geist-mono)",
                fontSize: "0.8rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                minHeight: "48px",
              }}
            >
              More options…
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Member card ───────────────────────────────────────────────────────────────

function MemberCard({
  member,
  isYou,
}: {
  member: MemberWithAvailability;
  isYou: boolean;
}) {
  const submitted = hasSubmittedAvailability(member);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
        padding: "0.875rem 1rem",
        background: isYou ? C.amberDim : C.surface,
        border: `1px solid ${isYou ? "rgba(240,180,40,0.2)" : C.border}`,
        borderRadius: "12px",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: C.surface,
          border: `2px solid ${isYou ? C.amber : submitted ? C.green : C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.7rem",
          fontWeight: 700,
          color: isYou ? C.amber : submitted ? C.green : C.muted,
          fontFamily: "var(--font-geist-mono)",
          flexShrink: 0,
        }}
      >
        {getInitials(member.name)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "0.9rem", fontWeight: 600, color: C.text }}>
            {member.name}
          </span>
          {isYou && (
            <span
              style={{
                fontSize: "0.6rem",
                fontFamily: "var(--font-geist-mono)",
                color: C.amber,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              you
            </span>
          )}
        </div>
        <div
          style={{ fontSize: "0.75rem", color: C.muted, marginTop: "0.15rem" }}
        >
          {submitted
            ? `${member.al_budget} AL day${member.al_budget === 1 ? "" : "s"} · ${member.departure_airports.join(", ")} · ${member.date_ranges.length} window${member.date_ranges.length === 1 ? "" : "s"}`
            : "Hasn't added availability yet"}
        </div>
      </div>

      <div
        style={{
          fontSize: "0.65rem",
          fontFamily: "var(--font-geist-mono)",
          color: submitted ? C.green : C.muted,
          letterSpacing: "0.05em",
          flexShrink: 0,
        }}
      >
        {submitted ? "✓ ready" : "pending"}
      </div>
    </div>
  );
}

// ── Not found ─────────────────────────────────────────────────────────────────

// ── Window card ───────────────────────────────────────────────────────────────

function WindowCard({
  window: w,
  members,
  rank,
  canFindFlights,
  slug,
}: {
  window: DateWindow;
  members: MemberWithAvailability[];
  rank: number;
  canFindFlights: boolean;
  slug: string;
}) {
  const isTop = rank === 0;
  const isFull = w.quorum === "full";
  const accentColor = isFull ? C.green : C.amber;
  const accentDim = isFull ? C.greenDim : C.amberDim;
  const accentBorder = isFull ? "rgba(74,222,128,0.2)" : "rgba(240,180,40,0.2)";

  const unavailableNames = w.unavailable_member_ids
    .map((id) => members.find((m) => m.id === id)?.name.split(" ")[0])
    .filter(Boolean)
    .join(", ");

  const availableNames = w.available_member_ids
    .map((id) => members.find((m) => m.id === id)?.name.split(" ")[0])
    .filter(Boolean)
    .join(", ");

  return (
    <div
      style={{
        background: isTop ? accentDim : C.surface,
        border: `1px solid ${isTop ? accentBorder : C.border}`,
        borderRadius: "14px",
        padding: "1rem 1.25rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top badge */}
      {isTop && (
        <div
          style={{
            position: "absolute",
            top: "0.75rem",
            right: "0.75rem",
            background: accentColor,
            color: "#0D0800",
            fontSize: "0.6rem",
            fontFamily: "var(--font-geist-mono)",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "0.2rem 0.5rem",
            borderRadius: "100px",
          }}
        >
          best match
        </div>
      )}

      {/* Dates + nights */}
      <div style={{ marginBottom: "0.4rem" }}>
        <span
          style={{
            fontSize: "0.95rem",
            fontWeight: 700,
            color: C.cream,
          }}
        >
          {formatWindowDates(w)}
        </span>
        <span
          style={{
            marginLeft: "0.6rem",
            fontSize: "0.72rem",
            color: C.muted,
            fontFamily: "var(--font-geist-mono)",
          }}
        >
          {windowNightsLabel(w)}
        </span>
      </div>

      {/* AL days */}
      <div
        style={{
          fontSize: "0.75rem",
          color: C.muted,
          marginBottom: "0.6rem",
          fontFamily: "var(--font-geist-mono)",
        }}
      >
        {w.al_days_required === 0
          ? "No AL needed"
          : `${w.al_days_required} AL day${w.al_days_required === 1 ? "" : "s"} min`}
      </div>

      {/* Who's in / out */}
      <div style={{ fontSize: "0.8rem", color: C.muted, lineHeight: 1.5 }}>
        <span style={{ color: accentColor }}>
          {availableNames} can make this
        </span>
        {unavailableNames && <span> · {unavailableNames} unavailable</span>}
      </div>

      {/* Quorum pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "0.75rem",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            padding: "0.2rem 0.6rem",
            background: accentDim,
            border: `1px solid ${accentBorder}`,
            borderRadius: "100px",
            fontSize: "0.65rem",
            fontFamily: "var(--font-geist-mono)",
            color: accentColor,
            letterSpacing: "0.05em",
          }}
        >
          {w.attendee_count}/
          {members.filter((m) => m.al_budget !== null).length} going
          {isFull && " · everyone"}
        </div>

        {canFindFlights && (
          <a
            href={`/apps/holiday-bazaar/trip/${slug}/flights?window_start=${w.start_date}&window_end=${w.end_date}`}
            style={{
              padding: "0.35rem 0.9rem",
              background: C.amber,
              color: "#0D0800",
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              borderRadius: "100px",
              textDecoration: "none",
              minHeight: "32px",
              display: "flex",
              alignItems: "center",
            }}
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/apps/holiday-bazaar/trip/${slug}/flights?window_start=${w.start_date}&window_end=${w.end_date}`;
            }}
          >
            flights →
          </a>
        )}
      </div>
    </div>
  );
}

function NotFound() {
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
      }}
    >
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🐍</div>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: C.cream,
          marginBottom: "0.5rem",
        }}
      >
        Trip not found
      </h1>
      <p
        style={{
          fontSize: "0.9rem",
          color: C.muted,
          maxWidth: "28ch",
          lineHeight: 1.6,
        }}
      >
        Sssalem can&apos;t find this trip. The link may be invalid or expired.
      </p>
      <a
        href="/apps/holiday-bazaar"
        style={{
          marginTop: "1.5rem",
          fontSize: "0.8rem",
          fontFamily: "var(--font-geist-mono)",
          color: C.amber,
          textDecoration: "none",
          letterSpacing: "0.08em",
        }}
      >
        ← Start a new trip
      </a>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TripView({ slug }: { slug: string }) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<MemberWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [session, setSession] = useState<GuestSession | null>(null);

  const fetchTrip = useCallback(async () => {
    const { data: tripData, error: tripError } = await supabase
      .from("trips")
      .select("*")
      .eq("id", slug)
      .single();

    if (tripError || !tripData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setTrip(tripData);

    const { data: membersData } = await supabase
      .from("members")
      .select("*, date_ranges(*)")
      .eq("trip_id", slug)
      .order("joined_at", { ascending: true });

    setMembers((membersData as MemberWithAvailability[]) ?? []);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    const s = getGuestSession(slug);
    if (s?.member_id !== session?.member_id) {
      setSession(s);
    }
    fetchTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, fetchTrip]);

  // Poll for new members every 15s
  useEffect(() => {
    const interval = setInterval(fetchTrip, 15000);
    return () => clearInterval(interval);
  }, [fetchTrip]);

  const windows = useMemo(() => scoreWindows(members), [members]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: C.bg,
        }}
      >
        <span
          style={{
            fontSize: "0.8rem",
            color: C.muted,
            fontFamily: "var(--font-geist-mono)",
          }}
        >
          Opening the bazaar…
        </span>
      </div>
    );
  }

  if (notFound || !trip) return <NotFound />;

  const submittedCount = members.filter(hasSubmittedAvailability).length;
  const pendingCount = members.length - submittedCount;
  const canFindFlights = submittedCount >= 2;

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
          href="/apps/holiday-bazaar"
          style={{
            fontSize: "0.75rem",
            fontFamily: "var(--font-geist-mono)",
            color: C.muted,
            textDecoration: "none",
            letterSpacing: "0.05em",
          }}
        >
          ← bazaar
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
          {slug}
        </span>
      </div>

      <div
        style={{
          maxWidth: "480px",
          margin: "0 auto",
          padding: "1.5rem 1.25rem 6rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.75rem",
        }}
      >
        {/* Trip hero */}
        <div>
          <p
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.65rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: C.amber,
              opacity: 0.8,
              marginBottom: "0.4rem",
            }}
          >
            🏮 group trip
          </p>
          <h1
            style={{
              fontSize: "clamp(1.5rem, 6vw, 2rem)",
              fontWeight: 700,
              color: C.cream,
              lineHeight: 1.2,
              marginBottom: "0.5rem",
            }}
          >
            {trip.name}
          </h1>
          <p style={{ fontSize: "0.875rem", color: C.muted }}>
            {members.length} {members.length === 1 ? "person" : "people"} in the
            group
            {pendingCount > 0 && ` · waiting on ${pendingCount}`}
          </p>
        </div>

        {/* Avatars row */}
        {members.length > 0 && (
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {members.map((m) => (
              <Avatar
                key={m.id}
                name={m.name}
                isYou={m.id === session?.member_id}
                hasAvailability={hasSubmittedAvailability(m)}
              />
            ))}
          </div>
        )}

        {/* Invite nudge */}
        <div
          style={{
            background: C.amberDim,
            border: `1px solid rgba(240,180,40,0.2)`,
            borderRadius: "14px",
            padding: "1rem 1.25rem",
          }}
        >
          <p
            style={{
              fontSize: "0.875rem",
              color: C.cream,
              fontWeight: 600,
              marginBottom: "0.25rem",
            }}
          >
            Invite the group
          </p>
          <p
            style={{
              fontSize: "0.8rem",
              color: C.muted,
              marginBottom: "1rem",
              lineHeight: 1.5,
            }}
          >
            Share the link so everyone can add their dates. The more people, the
            better the suggestions.
          </p>
          <button
            onClick={() => setShowShare(true)}
            style={{
              padding: "0.7rem 1.5rem",
              background: C.amber,
              color: "#0D0800",
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              border: "none",
              borderRadius: "100px",
              cursor: "pointer",
              minHeight: "44px",
            }}
          >
            Share link →
          </button>
        </div>

        {/* Add your availability CTA — shown if the current user hasn't submitted yet */}
        {session &&
          members.find(
            (m) => m.id === session.member_id && !hasSubmittedAvailability(m),
          ) && (
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: "14px",
                padding: "1rem 1.25rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.875rem",
                  color: C.cream,
                  fontWeight: 600,
                  marginBottom: "0.25rem",
                }}
              >
                Your turn
              </p>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: C.muted,
                  marginBottom: "1rem",
                  lineHeight: 1.5,
                }}
              >
                Add your available dates, departure airport, and how many AL
                days you&apos;re happy to use.
              </p>
              <a
                href={`/apps/holiday-bazaar/trip/${slug}/join`}
                style={{
                  display: "inline-block",
                  padding: "0.7rem 1.5rem",
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  color: C.text,
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  borderRadius: "100px",
                  textDecoration: "none",
                  minHeight: "44px",
                  lineHeight: "28px",
                  boxSizing: "border-box",
                }}
              >
                Add my dates →
              </a>
            </div>
          )}

        {/* Members list */}
        <div>
          <p
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.65rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: C.muted,
              marginBottom: "0.75rem",
            }}
          >
            The group
          </p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}
          >
            {members.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                isYou={m.id === session?.member_id}
              />
            ))}
          </div>
        </div>

        {/* Date suggestions */}
        <div>
          <p
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.65rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: C.muted,
              marginBottom: "0.75rem",
            }}
          >
            Date suggestions
          </p>

          {submittedCount < 2 ? (
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: "14px",
                padding: "1.25rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.875rem",
                  color: C.muted,
                  lineHeight: 1.6,
                }}
              >
                Waiting for at least 2 people to add availability before
                surfacing windows.
                {pendingCount > 0 &&
                  ` Nudge ${pendingCount} more person${pendingCount === 1 ? "" : "s"} to join.`}
              </p>
            </div>
          ) : windows.length === 0 ? (
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: "14px",
                padding: "1.25rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.875rem",
                  color: C.muted,
                  lineHeight: 1.6,
                }}
              >
                No overlapping windows found yet. Try adding more available date
                ranges.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              {windows.map((w: DateWindow, i: number) => (
                <WindowCard
                  key={`${w.start_date}-${w.end_date}`}
                  window={w}
                  members={members}
                  rank={i}
                  canFindFlights={canFindFlights}
                  slug={slug}
                />
              ))}
            </div>
          )}
        </div>

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

      {/* Share sheet */}
      {showShare && (
        <ShareSheet
          tripId={trip.id}
          tripName={trip.name}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
