"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
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

// ── AL patterns (mirrors scoring.ts) ─────────────────────────────────────────
// depart_day: 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat

const AL_PATTERNS = [
  {
    id: "SAT_SUN",
    al_days: 0,
    nights: 2,
    depart_day: 6,
    label: "Sat → Sun",
    note: "Weekend — no AL needed",
  },
  {
    id: "FRI_MORN_SUN",
    al_days: 1,
    nights: 2,
    depart_day: 5,
    label: "Fri → Sun",
    note: "1 AL day · Fri off",
  },
  {
    id: "FRI_EVE_MON",
    al_days: 1,
    nights: 3,
    depart_day: 5,
    label: "Fri eve → Mon",
    note: "1 AL day · Fri after work + Mon off",
  },
  {
    id: "THU_EVE_SUN",
    al_days: 1,
    nights: 3,
    depart_day: 4,
    label: "Thu eve → Sun",
    note: "1 AL day · Thu after work",
  },
  {
    id: "FRI_MORN_MON",
    al_days: 2,
    nights: 3,
    depart_day: 5,
    label: "Fri → Mon",
    note: "2 AL days · Fri + Mon off",
  },
  {
    id: "THU_EVE_MON",
    al_days: 2,
    nights: 4,
    depart_day: 4,
    label: "Thu eve → Mon",
    note: "2 AL days · Thu after work + Mon off",
  },
  {
    id: "WED_EVE_MON",
    al_days: 3,
    nights: 5,
    depart_day: 3,
    label: "Wed eve → Mon",
    note: "3 AL days · Wed after work + Mon off",
  },
] as const;

interface TripWindow {
  key: string;
  start_date: string;
  end_date: string;
  pattern_label: string;
  pattern_note: string;
  al_days: number;
  nights: number;
  group_overlap: "full" | "partial" | "none";
}

function generateWindows(
  alBudget: number,
  otherMembers: MemberWithAvailability[],
  lookAheadDays = 180,
): TripWindow[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const windows: TripWindow[] = [];
  const seen = new Set<string>();

  const validPatterns = AL_PATTERNS.filter((p) => p.al_days <= alBudget);

  for (let i = 1; i < lookAheadDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dow = d.getDay();

    for (const pattern of validPatterns) {
      if (pattern.depart_day !== dow) continue;

      const end = new Date(d);
      end.setDate(end.getDate() + pattern.nights);
      const startISO = toISODate(d);
      const endISO = toISODate(end);
      const key = `${startISO}__${endISO}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // Group overlap
      let availCount = 0;
      for (const m of otherMembers) {
        const hasRange = m.date_ranges.some(
          (r) => r.start_date <= startISO && r.end_date >= endISO,
        );
        if (hasRange) availCount++;
      }
      const ratio =
        otherMembers.length > 0 ? availCount / otherMembers.length : 0;
      const group_overlap: TripWindow["group_overlap"] =
        otherMembers.length === 0
          ? "none"
          : ratio >= 0.8
            ? "full"
            : ratio >= 0.4
              ? "partial"
              : "none";

      windows.push({
        key,
        start_date: startISO,
        end_date: endISO,
        pattern_label: pattern.label,
        pattern_note: pattern.note,
        al_days: pattern.al_days,
        nights: pattern.nights,
        group_overlap,
      });
    }
  }

  // Sort: group overlap first, then chronologically
  windows.sort((a, b) => {
    const overlapScore = { full: 2, partial: 1, none: 0 };
    const scoreDiff =
      overlapScore[b.group_overlap] - overlapScore[a.group_overlap];
    if (scoreDiff !== 0) return scoreDiff;
    return a.start_date.localeCompare(b.start_date);
  });

  return windows;
}

function formatWindowDate(iso: string, includeWeekday = true): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: includeWeekday ? "short" : undefined,
    day: "numeric",
    month: "short",
  });
}

function groupWindowsByMonth(
  windows: TripWindow[],
): { month: string; windows: TripWindow[] }[] {
  const map = new Map<string, TripWindow[]>();
  for (const w of windows) {
    const month = new Date(w.start_date).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
    if (!map.has(month)) map.set(month, []);
    map.get(month)!.push(w);
  }
  return Array.from(map.entries()).map(([month, windows]) => ({
    month,
    windows,
  }));
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

// ── Window picker ─────────────────────────────────────────────────────────────

function WindowPicker({
  alBudget,
  selected,
  onToggle,
  otherMembers,
}: {
  alBudget: number;
  selected: Set<string>;
  onToggle: (key: string) => void;
  otherMembers: MemberWithAvailability[];
}) {
  const windows = useMemo(
    () => generateWindows(alBudget, otherMembers),
    [alBudget, otherMembers],
  );

  const grouped = useMemo(() => groupWindowsByMonth(windows), [windows]);

  if (windows.length === 0) {
    return (
      <p style={{ fontSize: "0.875rem", color: C.muted, lineHeight: 1.6 }}>
        No valid windows found for your AL budget in the next 6 months.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Legend */}
      {otherMembers.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "1rem",
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
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: C.green,
                display: "inline-block",
              }}
            />
            group free
          </span>
          <span
            style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: C.amber,
                display: "inline-block",
              }}
            />
            some free
          </span>
        </div>
      )}

      {grouped.map(({ month, windows: mw }) => (
        <div key={month}>
          {/* Month header */}
          <p
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.65rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: C.muted,
              marginBottom: "0.5rem",
            }}
          >
            {month}
          </p>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}
          >
            {mw.map((w) => {
              const isSelected = selected.has(w.key);
              const dotColor =
                w.group_overlap === "full"
                  ? C.green
                  : w.group_overlap === "partial"
                    ? C.amber
                    : null;

              return (
                <button
                  key={w.key}
                  onClick={() => onToggle(w.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    background: isSelected ? C.amberDim : C.surface,
                    border: `1px solid ${isSelected ? C.borderActive : C.border}`,
                    borderRadius: "12px",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    transition: "all 0.12s",
                    minHeight: "56px",
                  }}
                >
                  {/* Checkmark */}
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      border: `2px solid ${isSelected ? C.amber : C.border}`,
                      background: isSelected ? C.amber : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.12s",
                      fontSize: "0.7rem",
                      color: "#0D0800",
                      fontWeight: 700,
                    }}
                  >
                    {isSelected ? "✓" : ""}
                  </div>

                  {/* Dates + pattern */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.15rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: isSelected ? C.amber : C.cream,
                        }}
                      >
                        {formatWindowDate(w.start_date)} →{" "}
                        {formatWindowDate(w.end_date)}
                      </span>
                      {dotColor && (
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: dotColor,
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: C.muted,
                        fontFamily: "var(--font-geist-mono)",
                      }}
                    >
                      {w.pattern_note} · {w.nights} night
                      {w.nights === 1 ? "" : "s"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
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
  const [selectedWindowKeys, setSelectedWindowKeys] = useState<Set<string>>(
    new Set(),
  );
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
  const stickyBottom = step === "calendar";

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
    if (step === "calendar" && selectedWindowKeys.size === 0)
      return "Pick at least one window you could make.";
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
          date_ranges: Array.from(selectedWindowKeys).map((key) => {
            const [start_date, end_date] = key.split("__");
            return { start_date, end_date };
          }),
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
    minHeight: "52px",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
    WebkitTapHighlightColor: "transparent",
    touchAction: "manipulation",
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
        // Extra bottom padding when CTA is sticky so content isn't hidden under it
        paddingBottom: stickyBottom ? "96px" : 0,
        boxSizing: "border-box",
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
            padding: "0.5rem 0",
            minHeight: "44px",
            display: "flex",
            alignItems: "center",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
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
                When could you go?
              </h1>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: C.muted,
                  lineHeight: 1.5,
                }}
              >
                Tap any windows that work for you.
                {selectedWindowKeys.size > 0 && (
                  <span style={{ color: C.amber }}>
                    {" "}
                    {selectedWindowKeys.size} selected
                  </span>
                )}
                {otherMembers.length > 0 && " Dots show when others are free."}
              </p>
            </div>
            <WindowPicker
              alBudget={Number(alDays)}
              selected={selectedWindowKeys}
              onToggle={(key) => {
                const next = new Set(selectedWindowKeys);
                if (next.has(key)) next.delete(key);
                else next.add(key);
                setSelectedWindowKeys(next);
              }}
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

        {/* Continue button — inline (non-calendar steps) */}
        {!stickyBottom && (
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
              fontSize: "0.85rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              border: "none",
              borderRadius: "12px",
              cursor: canContinue ? "pointer" : "not-allowed",
              minHeight: "56px",
              transition: "background 0.15s, color 0.15s",
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
            }}
          >
            Continue →
          </button>
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
            marginTop: "2rem",
            textAlign: "center",
            display: "block",
          }}
        >
          Part of randomorium.ai &nbsp;·&nbsp;{" "}
          <span style={{ color: C.amber }}>Buy a travel hat →</span>
        </a>
      </div>

      {/* Sticky bottom CTA — calendar step only */}
      {stickyBottom && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "0.75rem 1.25rem",
            paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
            background: "rgba(13, 8, 0, 0.92)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
            zIndex: 50,
          }}
        >
          {selectedWindowKeys.size > 0 && (
            <p
              style={{
                fontSize: "0.72rem",
                color: C.amber,
                fontFamily: "var(--font-geist-mono)",
                textAlign: "center",
                margin: 0,
              }}
            >
              {selectedWindowKeys.size} window
              {selectedWindowKeys.size === 1 ? "" : "s"} selected
            </p>
          )}
          <button
            onClick={handleNext}
            disabled={!canContinue}
            style={{
              width: "100%",
              padding: "0.9rem",
              background: canContinue ? C.amber : "rgba(240,180,40,0.2)",
              color: canContinue ? "#0D0800" : "rgba(240,180,40,0.4)",
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.85rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              border: "none",
              borderRadius: "12px",
              cursor: canContinue ? "pointer" : "not-allowed",
              minHeight: "56px",
              transition: "background 0.15s, color 0.15s",
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
            }}
          >
            Add me to the trip →
          </button>
        </div>
      )}
    </div>
  );
}
