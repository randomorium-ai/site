"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/holiday-bazaar/supabase";
import { searchAirports } from "@/lib/holiday-bazaar/airports";
import type { Airport } from "@/lib/holiday-bazaar/airports";
import type {
  Trip,
  MemberWithAvailability,
  GuestSession,
} from "@/lib/holiday-bazaar/types";
import { ThemeProvider, ThemeToggle, useTheme } from "../../../theme";

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

// ── Weekend calendar ──────────────────────────────────────────────────────────

// Returns ISO date string for the Sunday following a given Saturday ISO string
function satToSun(satISO: string): string {
  const sat = new Date(satISO);
  sat.setDate(sat.getDate() + 1);
  return toISODate(sat);
}

function WeekendCalendar({
  selected,
  onToggle,
  otherMembers,
}: {
  selected: Set<string>; // set of Saturday ISO dates
  onToggle: (satISO: string) => void;
  otherMembers: MemberWithAvailability[];
}) {
  const { C } = useTheme();

  const months = useMemo(() => {
    const result: Date[] = [];
    const now = new Date();
    for (let m = 0; m < 12; m++) {
      result.push(new Date(now.getFullYear(), now.getMonth() + m, 1));
    }
    return result;
  }, []);

  const getOverlap = useCallback(
    (satISO: string): "full" | "partial" | "none" => {
      if (otherMembers.length === 0) return "none";
      const sunISO = satToSun(satISO);
      let count = 0;
      for (const m of otherMembers) {
        if (
          m.date_ranges.some(
            (r) => r.start_date <= satISO && r.end_date >= sunISO,
          )
        )
          count++;
      }
      if (count === otherMembers.length) return "full";
      if (count > 0) return "partial";
      return "none";
    },
    [otherMembers],
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {months.map((monthDate) => {
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        // Mon=0 … Sun=6
        const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;

        const cells: (number | null)[] = [
          ...Array(firstDow).fill(null),
          ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
        ];
        while (cells.length % 7 !== 0) cells.push(null);

        const weeks: (number | null)[][] = [];
        for (let i = 0; i < cells.length; i += 7)
          weeks.push(cells.slice(i, i + 7));

        const hasWeekend = weeks.some((w) => w[5] != null || w[6] != null);
        if (!hasWeekend) return null;

        const monthLabel = monthDate.toLocaleDateString("en-GB", {
          month: "long",
          year: "numeric",
        });

        return (
          <div key={`${year}-${month}`}>
            <p
              style={{
                fontFamily: C.fontMono,
                fontSize: "0.65rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: C.muted,
                marginBottom: "0.5rem",
              }}
            >
              {monthLabel}
            </p>

            {/* Day headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                marginBottom: "2px",
              }}
            >
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div
                  key={i}
                  style={{
                    textAlign: "center",
                    fontSize: "0.6rem",
                    fontFamily: C.fontMono,
                    color: i >= 5 ? C.amber : C.muted,
                    opacity: i >= 5 ? 0.9 : 0.4,
                    padding: "0.2rem 0",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "2px" }}
            >
              {weeks.map((week, wi) => (
                <div
                  key={wi}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: "2px",
                  }}
                >
                  {week.map((day, di) => {
                    const isSat = di === 5;
                    const isSun = di === 6;
                    const isWeekend = isSat || isSun;

                    if (!day) return <div key={di} />;

                    const pad = (n: number) => String(n).padStart(2, "0");
                    const dateISO = `${year}-${pad(month + 1)}-${pad(day)}`;

                    // Derive the Saturday key for this cell
                    let satISO: string | null = null;
                    if (isSat) {
                      satISO = dateISO;
                    } else if (isSun) {
                      const sat = new Date(year, month, day - 1);
                      satISO = `${sat.getFullYear()}-${pad(sat.getMonth() + 1)}-${pad(sat.getDate())}`;
                    }

                    const isSelected = satISO ? selected.has(satISO) : false;
                    const isPast = new Date(year, month, day) < today;
                    const overlap =
                      isSat && satISO ? getOverlap(satISO) : "none";

                    if (!isWeekend) {
                      return (
                        <div
                          key={di}
                          style={{
                            textAlign: "center",
                            padding: "0.65rem 0",
                            fontSize: "0.8rem",
                            color: C.muted,
                            opacity: 0.3,
                          }}
                        >
                          {day}
                        </div>
                      );
                    }

                    return (
                      <button
                        key={di}
                        onClick={() =>
                          satISO && !isPast && onToggle(satISO)
                        }
                        disabled={isPast}
                        style={{
                          padding: "0.5rem 0",
                          textAlign: "center",
                          fontSize: "0.875rem",
                          fontWeight: isSelected ? 700 : 400,
                          background: isSelected ? C.amberDim : "transparent",
                          border: `1px solid ${isSelected ? C.borderActive : "transparent"}`,
                          borderRadius: "8px",
                          color: isPast
                            ? C.muted
                            : isSelected
                              ? C.amber
                              : C.text,
                          cursor: isPast ? "default" : "pointer",
                          opacity: isPast ? 0.3 : 1,
                          transition: "all 0.1s",
                          WebkitTapHighlightColor: "transparent",
                          minHeight: "44px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "3px",
                        }}
                      >
                        {day}
                        {isSat && overlap !== "none" && !isPast && (
                          <div
                            style={{
                              width: "4px",
                              height: "4px",
                              borderRadius: "50%",
                              background:
                                overlap === "full" ? C.green : C.amber,
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── (removed AL patterns — AL is now derived from flight results, not user input) ──

// ── Step indicator ────────────────────────────────────────────────────────────

function StepDots({ step, total }: { step: number; total: number }) {
  const { C } = useTheme();
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
  const { C } = useTheme();
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
                fontFamily: C.fontMono,
              }}
            >
              <span>{a.iata}</span>
              <span
                style={{
                  fontSize: "0.7rem",
                  color: C.muted,
                  fontFamily: C.fontDisplay,
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
            fontFamily: C.fontDisplay,
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
            background: C.surfaceElevated,
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
                    fontFamily: C.fontMono,
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

// ── Main component ────────────────────────────────────────────────────────────

type Step = "name" | "al" | "airports" | "calendar" | "submitting";

function JoinViewInner({ slug }: { slug: string }) {
  const router = useRouter();
  const { C } = useTheme();

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
  const [selectedWeekends, setSelectedWeekends] = useState<Set<string>>(
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

      // Pre-populate form if visitor is an existing member
      const session = getGuestSession(slug);
      if (session) {
        const me = members.find((m) => m.id === session.member_id);
        if (me) {
          setIsOrganiser(true);
          setName(me.name);
          if (me.al_budget !== null) setAlDays(me.al_budget);
          if (me.departure_airports.length > 0) {
            const { searchAirports } = await import("@/lib/holiday-bazaar/airports");
            const populated = me.departure_airports
              .map((iata) => searchAirports(iata).find((a) => a.iata === iata))
              .filter(Boolean) as import("@/lib/holiday-bazaar/airports").Airport[];
            if (populated.length > 0) setAirports(populated);
          }
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
    if (step === "al" && alDays === "") return "Enter a number between 0 and 5.";
    if (step === "airports" && airports.length === 0)
      return "Pick at least one departure airport.";
    if (step === "calendar" && selectedWeekends.size === 0)
      return "Pick at least one weekend you could make.";
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
          member_id: session?.member_id ?? undefined,
          name: name.trim(),
          al_budget: Number(alDays),
          departure_airports: airports.map((a) => a.iata),
          date_ranges: Array.from(selectedWeekends).map((satISO) => ({
            start_date: satISO,
            end_date: satToSun(satISO),
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setStep("calendar");
        return;
      }

      saveGuestSession(data.member_id, slug);

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
            fontFamily: C.fontMono,
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
            fontFamily: C.fontMono,
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
            fontFamily: C.fontMono,
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
    fontFamily: C.fontDisplay,
    outline: "none",
    minHeight: "52px",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
    WebkitTapHighlightColor: "transparent",
    touchAction: "manipulation",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: C.fontMono,
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
        background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${C.gradientAccent} 0%, transparent 60%), ${C.bg}`,
        color: C.text,
        fontFamily: C.fontDisplay,
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
            fontFamily: C.fontMono,
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <ThemeToggle />
          <span
            style={{
              fontSize: "0.65rem",
              fontFamily: C.fontMono,
              color: C.muted,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {trip.name}
          </span>
        </div>
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
                  fontFamily: C.fontMono,
                  fontSize: "0.65rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: C.amber,
                  opacity: 0.8,
                  marginBottom: "0.4rem",
                }}
              >
                step 1 of 3
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
                {isOrganiser ? "Update your details" : "Who are you?"}
              </h1>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: C.muted,
                  lineHeight: 1.5,
                }}
              >
                {isOrganiser
                  ? "Change your name, airports, AL days, or available weekends."
                  : otherMembers.length > 0
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
                  fontFamily: C.fontMono,
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
                How many days are you happy to take off around a weekend?
              </p>
            </div>

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
                    fontFamily: C.fontMono,
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    minHeight: "52px",
                    transition: "all 0.12s",
                    WebkitTapHighlightColor: "transparent",
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
                  ? "Weekend only — Sat/Sun flights."
                  : alDays === 1
                    ? "1 day — Thu eve or Fri flights out, Sun or Mon back."
                    : alDays === 2
                      ? "2 days — Wed eve out, Sun back (4 nights) or Thu eve out, Mon back."
                      : `${alDays} days — we'll find the longest trip that fits.`}
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
                  fontFamily: C.fontMono,
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
                  fontFamily: C.fontMono,
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
                Tap the weekends you could make.
                {selectedWeekends.size > 0 && (
                  <span style={{ color: C.amber }}>
                    {" "}
                    {selectedWeekends.size} selected
                  </span>
                )}
                {otherMembers.length > 0 && " Dots show when others are free."}
              </p>
            </div>
            <WeekendCalendar
              selected={selectedWeekends}
              onToggle={(satISO) => {
                const next = new Set(selectedWeekends);
                if (next.has(satISO)) next.delete(satISO);
                else next.add(satISO);
                setSelectedWeekends(next);
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
              color: canContinue ? C.bg : "rgba(240,180,40,0.4)",
              fontFamily: C.fontMono,
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
            background: C.bg + "eb",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
            zIndex: 50,
          }}
        >
          {selectedWeekends.size > 0 && (
            <p
              style={{
                fontSize: "0.72rem",
                color: C.amber,
                fontFamily: C.fontMono,
                textAlign: "center",
                margin: 0,
              }}
            >
              {selectedWeekends.size} weekend
              {selectedWeekends.size === 1 ? "" : "s"} selected
            </p>
          )}
          <button
            onClick={handleNext}
            disabled={!canContinue}
            style={{
              width: "100%",
              padding: "0.9rem",
              background: canContinue ? C.amber : "rgba(240,180,40,0.2)",
              color: canContinue ? C.bg : "rgba(240,180,40,0.4)",
              fontFamily: C.fontMono,
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

export default function JoinView({ slug }: { slug: string }) {
  return (
    <ThemeProvider>
      <JoinViewInner slug={slug} />
    </ThemeProvider>
  );
}
