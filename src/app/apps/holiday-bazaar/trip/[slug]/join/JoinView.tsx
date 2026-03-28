"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import "react-day-picker/src/style.css";
import { supabase } from "@/lib/holiday-bazaar/supabase";
import { searchAirports } from "@/lib/holiday-bazaar/airports";
import type { Airport } from "@/lib/holiday-bazaar/airports";
import type {
  Trip,
  MemberWithAvailability,
  GuestSession,
} from "@/lib/holiday-bazaar/types";

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#0D0800",
  surface: "rgba(255, 255, 255, 0.04)",
  surfaceHover: "rgba(255, 255, 255, 0.08)",
  border: "rgba(255, 255, 255, 0.09)",
  borderActive: "rgba(240, 180, 40, 0.6)",
  amber: "#F0B429",
  amberDim: "rgba(240, 180, 40, 0.12)",
  green: "#4ADE80",
  greenDim: "rgba(74, 222, 128, 0.12)",
  cream: "#F0E8D5",
  text: "rgba(255, 255, 255, 0.88)",
  muted: "rgba(255, 255, 255, 0.42)",
  border2: "rgba(255, 255, 255, 0.06)",
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

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

// Compute group availability overlay colours for a given date
function getDayColour(
  date: Date,
  members: MemberWithAvailability[],
): "green" | "amber" | "none" {
  if (members.length === 0) return "none";
  const iso = toISODate(date);
  let available = 0;
  for (const m of members) {
    for (const r of m.date_ranges) {
      if (iso >= r.start_date && iso <= r.end_date) {
        available++;
        break;
      }
    }
  }
  if (available === 0) return "none";
  const ratio = available / members.length;
  if (ratio >= 0.8) return "green";
  if (ratio >= 0.5) return "amber";
  return "none";
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "6px",
        justifyContent: "center",
        marginBottom: "1.75rem",
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === step ? "20px" : "6px",
            height: "6px",
            borderRadius: "3px",
            background:
              i === step
                ? C.amber
                : i < step
                  ? "rgba(240,180,40,0.4)"
                  : C.border,
            transition: "all 0.25s",
          }}
        />
      ))}
    </div>
  );
}

// ── Airport picker ────────────────────────────────────────────────────────────

function AirportPicker({
  selected,
  onChange,
}: {
  selected: Airport[];
  onChange: (airports: Airport[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (query.length >= 1) return searchAirports(query);
    return [];
  }, [query]);

  function select(airport: Airport) {
    if (selected.find((a) => a.iata === airport.iata)) return;
    if (selected.length >= 2) return;
    onChange([...selected, airport]);
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  }

  function remove(iata: string) {
    onChange(selected.filter((a) => a.iata !== iata));
  }

  const canAddMore = selected.length < 2;

  return (
    <div style={{ position: "relative" }}>
      {/* Selected chips */}
      {selected.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginBottom: "0.6rem",
          }}
        >
          {selected.map((a) => (
            <div
              key={a.iata}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.3rem 0.6rem 0.3rem 0.75rem",
                background: C.amberDim,
                border: `1px solid rgba(240,180,40,0.3)`,
                borderRadius: "100px",
                fontSize: "0.8rem",
                color: C.amber,
                fontFamily: "var(--font-geist-mono)",
              }}
            >
              <span>{a.iata}</span>
              <span
                style={{
                  fontSize: "0.7rem",
                  color: C.muted,
                  fontFamily: "var(--font-geist-sans)",
                }}
              >
                {a.city}
              </span>
              <button
                onClick={() => remove(a.iata)}
                style={{
                  background: "none",
                  border: "none",
                  color: C.muted,
                  cursor: "pointer",
                  padding: "0 0 0 2px",
                  fontSize: "0.9rem",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      {canAddMore && (
        <input
          ref={inputRef}
          type="text"
          placeholder={
            selected.length === 0
              ? "Search city or airport…"
              : "Add a second airport…"
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          style={{
            width: "100%",
            padding: "0.85rem 1rem",
            background: C.surface,
            border: `1px solid ${focused ? C.borderActive : C.border}`,
            borderRadius: "12px",
            color: C.text,
            fontSize: "1rem",
            fontFamily: "var(--font-geist-sans)",
            outline: "none",
            minHeight: "48px",
            boxSizing: "border-box",
            transition: "border-color 0.15s",
          }}
        />
      )}

      {/* Dropdown */}
      {focused && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#1A1200",
            border: `1px solid ${C.border}`,
            borderRadius: "12px",
            overflow: "hidden",
            zIndex: 50,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {results.map((a) => {
            const alreadySelected = !!selected.find((s) => s.iata === a.iata);
            return (
              <button
                key={a.iata}
                onMouseDown={() => select(a)}
                disabled={alreadySelected}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "none",
                  border: "none",
                  borderBottom: `1px solid ${C.border2}`,
                  cursor: alreadySelected ? "default" : "pointer",
                  textAlign: "left",
                  opacity: alreadySelected ? 0.4 : 1,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: "0.8rem",
                    color: C.amber,
                    minWidth: "36px",
                  }}
                >
                  {a.iata}
                </span>
                <span style={{ flex: 1, fontSize: "0.875rem", color: C.text }}>
                  {a.city}
                  <span
                    style={{
                      color: C.muted,
                      marginLeft: "0.4rem",
                      fontSize: "0.8rem",
                    }}
                  >
                    {a.name}
                  </span>
                </span>
                <span style={{ fontSize: "0.7rem", color: C.muted }}>
                  {a.country}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────

function GroupCalendar({
  ranges,
  onRangesChange,
  otherMembers,
}: {
  ranges: DateRange[];
  onRangesChange: (ranges: DateRange[]) => void;
  otherMembers: MemberWithAvailability[];
}) {
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(
    undefined,
  );

  function handleSelect(range: DateRange | undefined) {
    setPendingRange(range);
    // If range is complete (has both from and to), add it to the list
    if (range?.from && range?.to) {
      onRangesChange([...ranges, { from: range.from, to: range.to }]);
      setPendingRange(undefined);
    }
  }

  function removeRange(idx: number) {
    onRangesChange(ranges.filter((_, i) => i !== idx));
  }

  // Build modifiers for group availability overlay
  const groupAvailModifiers: Record<string, Date[]> = {
    groupGreen: [],
    groupAmber: [],
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Build a set of candidate days (next 6 months)
  if (otherMembers.length > 0) {
    for (let i = 0; i < 180; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const colour = getDayColour(d, otherMembers);
      if (colour === "green") groupAvailModifiers.groupGreen.push(new Date(d));
      else if (colour === "amber")
        groupAvailModifiers.groupAmber.push(new Date(d));
    }
  }

  return (
    <div>
      {/* Added ranges */}
      {ranges.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
            marginBottom: "1rem",
          }}
        >
          {ranges.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.5rem 0.75rem",
                background: C.greenDim,
                border: `1px solid rgba(74,222,128,0.2)`,
                borderRadius: "8px",
                fontSize: "0.8rem",
                color: C.green,
                fontFamily: "var(--font-geist-mono)",
              }}
            >
              <span>
                {r.from?.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
                {" → "}
                {r.to?.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
              <button
                onClick={() => removeRange(i)}
                style={{
                  background: "none",
                  border: "none",
                  color: C.muted,
                  cursor: "pointer",
                  fontSize: "1rem",
                  padding: "0 0 0 0.5rem",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      {otherMembers.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "0.75rem",
            fontSize: "0.7rem",
            color: C.muted,
            fontFamily: "var(--font-geist-mono)",
          }}
        >
          <span
            style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: C.green,
                display: "inline-block",
              }}
            />
            most free
          </span>
          <span
            style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: C.amber,
                display: "inline-block",
              }}
            />
            some free
          </span>
        </div>
      )}

      {/* Calendar */}
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: "16px",
          padding: "0.5rem",
          overflowX: "auto",
        }}
      >
        <style>{`
          .rdp-root {
            --rdp-accent-color: ${C.amber};
            --rdp-accent-background-color: rgba(240,180,40,0.15);
            --rdp-range_start-color: #0D0800;
            --rdp-range_end-color: #0D0800;
            --rdp-range_middle-color: ${C.cream};
            --rdp-range_start-date-background-color: ${C.amber};
            --rdp-range_end-date-background-color: ${C.amber};
            --rdp-today-color: ${C.amber};
            --rdp-day-height: 40px;
            --rdp-day-width: 40px;
            --rdp-day_button-height: 38px;
            --rdp-day_button-width: 38px;
            color: ${C.text};
            font-family: var(--font-geist-sans);
            font-size: 0.875rem;
            width: 100%;
          }
          .rdp-months { width: 100%; }
          .rdp-month { width: 100%; }
          .rdp-month_grid { width: 100%; }
          .rdp-caption_label { color: ${C.cream}; font-size: 0.95rem; }
          .rdp-chevron { fill: ${C.amber} !important; }
          .rdp-weekday { color: ${C.muted}; }
          .rdp-day_button:hover:not(:disabled) { background: rgba(240,180,40,0.15); }
          .rdp-day.groupGreen .rdp-day_button { box-shadow: inset 0 -2px 0 ${C.green}; }
          .rdp-day.groupAmber .rdp-day_button { box-shadow: inset 0 -2px 0 ${C.amber}; }
        `}</style>
        <DayPicker
          mode="range"
          selected={pendingRange}
          onSelect={handleSelect}
          disabled={{ before: new Date() }}
          modifiers={groupAvailModifiers}
          modifiersClassNames={{
            groupGreen: "groupGreen",
            groupAmber: "groupAmber",
          }}
          numberOfMonths={1}
          showOutsideDays={false}
        />
      </div>

      <p
        style={{
          fontSize: "0.72rem",
          color: C.muted,
          marginTop: "0.6rem",
          lineHeight: 1.5,
        }}
      >
        Tap a start date then an end date to add a window. Add as many windows
        as you like.
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Step = "name" | "al" | "airports" | "calendar" | "submitting";

export default function JoinView({ slug }: { slug: string }) {
  const router = useRouter();

  // Trip + existing members
  const [trip, setTrip] = useState<Trip | null>(null);
  const [otherMembers, setOtherMembers] = useState<MemberWithAvailability[]>(
    [],
  );
  const [loadingTrip, setLoadingTrip] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form state
  const [isOrganiser, setIsOrganiser] = useState(false);
  const [name, setName] = useState("");
  const [alDays, setAlDays] = useState<number | "">("");
  const [airports, setAirports] = useState<Airport[]>([]);
  const [dateRanges, setDateRanges] = useState<DateRange[]>([]);
  const [step, setStep] = useState<Step>("name");
  const [error, setError] = useState("");

  // Load trip data
  useEffect(() => {
    async function load() {
      const { data: tripData, error: tripErr } = await supabase
        .from("trips")
        .select("*")
        .eq("id", slug)
        .single();

      if (tripErr || !tripData) {
        setNotFound(true);
        setLoadingTrip(false);
        return;
      }
      setTrip(tripData);

      const { data: membersData } = await supabase
        .from("members")
        .select("*, date_ranges(*)")
        .eq("trip_id", slug)
        .order("joined_at", { ascending: true });

      const members = (membersData as MemberWithAvailability[]) ?? [];

      // Check if the current visitor is the organiser (already a member with no availability)
      const session = getGuestSession(slug);
      if (session) {
        const me = members.find((m) => m.id === session.member_id);
        if (me) {
          setIsOrganiser(true);
          setName(me.name);
        }
        setOtherMembers(members.filter((m) => m.id !== session.member_id));
      } else {
        setOtherMembers(members);
      }

      setLoadingTrip(false);
    }
    load();
  }, [slug]);

  // Step helpers
  const STEPS: Step[] = ["name", "al", "airports", "calendar"];
  const stepIndex = STEPS.indexOf(step);

  function nextStep() {
    setError("");
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }

  function prevStep() {
    setError("");
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  function validateCurrentStep(): string | null {
    if (step === "name" && !name.trim()) return "What should we call you?";
    if (step === "al" && alDays === "")
      return "Enter a number between 0 and 10.";
    if (step === "airports" && airports.length === 0)
      return "Pick at least one departure airport.";
    if (step === "calendar" && dateRanges.length === 0)
      return "Add at least one available window.";
    return null;
  }

  function handleNext() {
    const err = validateCurrentStep();
    if (err) {
      setError(err);
      return;
    }
    if (step === "calendar") {
      handleSubmit();
    } else {
      nextStep();
    }
  }

  async function handleSubmit() {
    setStep("submitting");
    setError("");

    const session = getGuestSession(slug);

    try {
      const res = await fetch("/api/holiday-bazaar/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip_id: slug,
          name: name.trim(),
          al_budget: Number(alDays),
          departure_airports: airports.map((a) => a.iata),
          date_ranges: dateRanges
            .filter((r) => r.from && r.to)
            .map((r) => ({
              start_date: toISODate(r.from!),
              end_date: toISODate(r.to!),
            })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setStep("calendar");
        return;
      }

      // Save session — overwrite organiser's if they're filling in their own availability
      if (!session || isOrganiser) {
        saveGuestSession(data.member_id, slug);
      } else {
        saveGuestSession(data.member_id, slug);
      }

      router.push(`/apps/holiday-bazaar/trip/${slug}`);
    } catch {
      setError("Couldn't reach the bazaar. Check your connection.");
      setStep("calendar");
    }
  }

  // ── Loading / not found ───────────────────────────────────────────────────

  if (loadingTrip) {
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

  if (notFound || !trip) {
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
          }}
        >
          ← Start a new trip
        </a>
      </div>
    );
  }

  // ── Submitting screen ─────────────────────────────────────────────────────

  if (step === "submitting") {
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
        <div style={{ fontSize: "2.5rem" }}>🏮</div>
        <p
          style={{
            fontSize: "0.875rem",
            color: C.muted,
            fontFamily: "var(--font-geist-mono)",
          }}
        >
          Adding you to the group…
        </p>
      </div>
    );
  }

  // ── Shared layout ─────────────────────────────────────────────────────────

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
    minHeight: "48px",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
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

  const canContinue = validateCurrentStep() === null;

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
        <button
          onClick={
            stepIndex > 0
              ? prevStep
              : () => router.push(`/apps/holiday-bazaar/trip/${slug}`)
          }
          style={{
            background: "none",
            border: "none",
            color: C.muted,
            fontSize: "0.8rem",
            cursor: "pointer",
            fontFamily: "var(--font-geist-mono)",
            letterSpacing: "0.05em",
            padding: 0,
          }}
        >
          ← {stepIndex > 0 ? "back" : "trip"}
        </button>
        <span
          style={{
            fontSize: "0.65rem",
            fontFamily: "var(--font-geist-mono)",
            color: C.muted,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {trip.name}
        </span>
      </div>

      <div
        style={{
          maxWidth: "480px",
          margin: "0 auto",
          padding: "1.5rem 1.25rem 6rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Step dots */}
        <StepDots step={stepIndex} total={STEPS.length} />

        {/* Step: name */}
        {step === "name" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
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
                step 1 of 4
              </p>
              <h1
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: C.cream,
                  lineHeight: 1.2,
                  marginBottom: "0.4rem",
                }}
              >
                Who are you?
              </h1>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: C.muted,
                  lineHeight: 1.5,
                }}
              >
                {otherMembers.length > 0
                  ? `${otherMembers.map((m) => m.name.split(" ")[0]).join(", ")} ${otherMembers.length === 1 ? "is" : "are"} already in.`
                  : `You're joining ${trip.name}.`}
              </p>
            </div>

            <div>
              <label style={labelStyle}>Your name</label>
              <input
                type="text"
                placeholder="e.g. Jordan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = C.borderActive)
                }
                onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                style={inputStyle}
                maxLength={40}
                autoFocus
                disabled={isOrganiser}
              />
              {isOrganiser && (
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: C.muted,
                    marginTop: "0.4rem",
                  }}
                >
                  You created this trip — just fill in your dates.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step: AL days */}
        {step === "al" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
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
                step 2 of 4
              </p>
              <h1
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: C.cream,
                  lineHeight: 1.2,
                  marginBottom: "0.4rem",
                }}
              >
                Annual leave
              </h1>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: C.muted,
                  lineHeight: 1.5,
                }}
              >
                How many days of annual leave are you happy to use?
              </p>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: C.muted,
                  lineHeight: 1.5,
                  marginTop: "0.25rem",
                  opacity: 0.7,
                }}
              >
                We&apos;ll use this to find flights that stretch your time away.
                Enter 0 for weekends only.
              </p>
            </div>

            {/* AL day buttons */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "0.5rem",
              }}
            >
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setAlDays(n)}
                  style={{
                    padding: "0.9rem 0.5rem",
                    background: alDays === n ? C.amberDim : C.surface,
                    border: `1px solid ${alDays === n ? C.borderActive : C.border}`,
                    borderRadius: "12px",
                    color: alDays === n ? C.amber : C.text,
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    minHeight: "52px",
                    transition: "all 0.12s",
                  }}
                >
                  {n}
                </button>
              ))}
              {[6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setAlDays(n)}
                  style={{
                    padding: "0.9rem 0.5rem",
                    background: alDays === n ? C.amberDim : C.surface,
                    border: `1px solid ${alDays === n ? C.borderActive : C.border}`,
                    borderRadius: "12px",
                    color: alDays === n ? C.amber : C.text,
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    minHeight: "52px",
                    transition: "all 0.12s",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>

            {alDays !== "" && (
              <p
                style={{
                  fontSize: "0.8rem",
                  color: C.muted,
                  lineHeight: 1.5,
                  textAlign: "center",
                }}
              >
                {alDays === 0
                  ? "Weekend trips only — Fri evening to Mon morning."
                  : `Up to ${alDays} AL day${alDays === 1 ? "" : "s"} — we'll find the best pattern.`}
              </p>
            )}
          </div>
        )}

        {/* Step: airports */}
        {step === "airports" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
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
                step 3 of 4
              </p>
              <h1
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: C.cream,
                  lineHeight: 1.2,
                  marginBottom: "0.4rem",
                }}
              >
                Where do you fly from?
              </h1>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: C.muted,
                  lineHeight: 1.5,
                }}
              >
                Pick up to 2 departure airports. We&apos;ll find the best flight
                for you from each.
              </p>
            </div>
            <AirportPicker selected={airports} onChange={setAirports} />
          </div>
        )}

        {/* Step: calendar */}
        {step === "calendar" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
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
                step 4 of 4
              </p>
              <h1
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: C.cream,
                  lineHeight: 1.2,
                  marginBottom: "0.4rem",
                }}
              >
                When are you free?
              </h1>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: C.muted,
                  lineHeight: 1.5,
                }}
              >
                Select your available date windows.
                {otherMembers.length > 0 &&
                  " Coloured dots show when others are free."}
              </p>
            </div>
            <GroupCalendar
              ranges={dateRanges}
              onRangesChange={setDateRanges}
              otherMembers={otherMembers}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <p style={{ fontSize: "0.8rem", color: C.danger, marginTop: "1rem" }}>
            {error}
          </p>
        )}

        {/* Continue button */}
        <button
          onClick={handleNext}
          disabled={!canContinue}
          style={{
            width: "100%",
            padding: "0.9rem",
            marginTop: "1.75rem",
            background: canContinue ? C.amber : "rgba(240,180,40,0.2)",
            color: canContinue ? "#0D0800" : "rgba(240,180,40,0.4)",
            fontFamily: "var(--font-geist-mono)",
            fontSize: "0.8rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            border: "none",
            borderRadius: "12px",
            cursor: canContinue ? "pointer" : "not-allowed",
            minHeight: "52px",
            transition: "background 0.15s, color 0.15s",
          }}
        >
          {step === "calendar" ? "Add me to the trip →" : "Continue →"}
        </button>

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
            marginTop: "2rem",
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
