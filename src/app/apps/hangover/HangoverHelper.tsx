"use client"

import { useReducer, useCallback } from "react"
import Link from "next/link"

// ── Palette (from spec — bazaar dark) ───────────────────────────────────────
const C = {
  bg: "#070512",
  surface: "rgba(5, 3, 1, 0.95)",
  teal: "#3ABCBD",
  cream: "#F0E8D5",
  amber: "#F5C040",
  text: "rgba(255, 255, 255, 0.85)",
  muted: "rgba(255, 255, 255, 0.38)",
  border: "rgba(255, 255, 255, 0.08)",
  danger: "#E85D5D",
}

// ── Questions (from spec exactly) ───────────────────────────────────────────
interface Answer {
  label: string
  score: number
}

interface Question {
  id: string
  text: string
  answers: Answer[]
}

const QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "How does your head feel right now?",
    answers: [
      { label: "No headache — fine actually", score: 0 },
      { label: "Dull ache, manageable", score: 1 },
      { label: "Proper throbbing", score: 2 },
      { label: "Severe — light and sound are a problem", score: 3 },
    ],
  },
  {
    id: "q2",
    text: "What's your stomach doing?",
    answers: [
      { label: "Fine, I could eat", score: 0 },
      { label: "Unsettled, not sure about food", score: 1 },
      { label: "Nauseous, food is not happening", score: 2 },
      { label: "Already been sick, or actively might be", score: 3 },
    ],
  },
  {
    id: "q3",
    text: "Have you had any water since you stopped drinking?",
    answers: [
      { label: "Yes, drank water before bed", score: 0 },
      { label: "A little, not much", score: 1 },
      { label: "No, nothing yet", score: 2 },
      { label: "I don't remember", score: 3 },
    ],
  },
  {
    id: "q4",
    text: "How much sleep did you get?",
    answers: [
      { label: "7+ hours, slept well", score: 0 },
      { label: "5–6 hours, okay", score: 1 },
      { label: "Under 5 hours, broken sleep", score: 2 },
      { label: "Barely slept / not sure", score: 3 },
    ],
  },
  {
    id: "q5",
    text: "What does today actually look like?",
    answers: [
      { label: "Nothing on, completely free", score: 0 },
      { label: "A couple of light things I could push", score: 1 },
      { label: "Some commitments I probably need to keep", score: 2 },
      { label: "It's a big day, I have to function", score: 3 },
    ],
  },
]

// ── Scoring (from spec exactly) ─────────────────────────────────────────────
function computeSeverity(raw: number): { severity: number; tier: string; label: string } {
  if (raw <= 2) {
    const severity = raw === 0 ? 1 : raw === 1 ? 2 : 3
    return { severity, tier: "Walking Wounded", label: "You'll survive. Probably." }
  }
  if (raw <= 5) {
    const severity = raw === 3 ? 4 : raw === 4 ? 5 : 6
    return { severity, tier: "Standard Suffering", label: "A familiar place. Sssalem has been here himself." }
  }
  if (raw <= 8) {
    const severity = raw <= 7 ? 7 : 8
    return { severity, tier: "Crisis Mode", label: "Sit down. Don't argue. Listen to Sssalem." }
  }
  const severity = raw <= 10 ? 9 : raw === 11 ? 10 : 10
  return { severity, tier: "Code Red", label: "Sssalem is not joking with you now." }
}

// ── Hat hooks (from spec) ───────────────────────────────────────────────────
function getHatHook(severity: number): string {
  if (severity <= 3) return "Yacht Poor"
  if (severity <= 6) return "Locally Sourced"
  if (severity <= 8) return "Definitely Fine"
  return "Corn Dad"
}

// ── Fallback itineraries (from spec — complete tier content) ────────────────
const FALLBACK_ITINERARIES: Record<string, string> = {
  "Walking Wounded": `WHAT YOU DO NOW
500ml water with a pinch of salt and sugar (oral rehydration). Paracetamol if head hurts — not ibuprofen, wait until after food.

Within 30 mins: Eat something with carbs and a little fat — toast with eggs, banana, porridge. Not a fry-up. Restore blood sugar and coat stomach lining.

WHAT COMES NEXT
Hour 1–2: Light movement if possible — short walk raises endorphins and accelerates metabolism. Not the gym.

Hour 2–4: Mostly functional. Tackle cognitively light tasks first. Avoid important decisions until after lunch.

Rest of day: One more litre of water across the day. Should be largely back to normal by afternoon.

THE TRUTH ABOUT TODAY
Commitments are achievable. No cancellations needed.

WATCH OUT FOR
Caffeine helps but time it right. Too early on an empty stomach will spike anxiety. Wait until after food.`,

  "Standard Suffering": `WHAT YOU DO NOW
Do not look at your phone more than necessary. 300ml water immediately — sip, don't gulp. Electrolyte sachet if available. If not: water + pinch of salt.

Wait 20 mins. If stomach has settled: plain crackers, dry toast, or banana. Nothing acidic, nothing greasy. If still nauseous: skip food, keep sipping water.

WHAT COMES NEXT
Once food is down (30–60 mins): Paracetamol, not ibuprofen. Ibuprofen irritates already-compromised stomach lining. 1000mg paracetamol is appropriate.

Hour 1–2: Dark room, minimal screen time. Sleep again if possible — 90 minutes now is worth more than pushing through.

Hour 2–4: Step-change improvement around the 3 hour mark if above followed. Light food again — something with protein.

Hour 4+: Functional but not sharp. Suitable for routine tasks, not creative or high-stakes work.

THE TRUTH ABOUT TODAY
Triage your commitments. Keep what you must, push what you can. Your functional window starts around hour 3–4.

WATCH OUT FOR
The false rally. You'll feel better around hour 2, do too much, then crash. Pace yourself.`,

  "Crisis Mode": `WHAT YOU DO NOW
Stop. Put the phone down after reading this. One thing only: water. 200ml, sipped over 10 minutes. If it stays down, another 200ml. Do not eat yet.

Medication: No ibuprofen. If headache is unbearable, single 500mg paracetamol only if water is staying down. Nothing else.

Cancellations: Cancel what you can. Script: "Really sorry, not well today — can we reschedule for tomorrow/Monday?" That is all you need to say.

WHAT COMES NEXT
Hour 1–2: Go back to bed if at all possible. Set alarm for 2–3 hours. Sleep is the most powerful recovery tool at this severity.

On waking: Nausea should be lower. Plain crackers or dry toast only. More water.

Hour 3–5: First food with substance — eggs, rice, something bland. Avoid caffeine until hour 4 minimum.

THE TRUTH ABOUT TODAY
Most of today is lost. Goal is to protect tomorrow. Realistic functional window is late afternoon at earliest for light tasks. Do not commit to anything cognitive or social before then.

WATCH OUT FOR
Do not take ibuprofen. Your stomach lining cannot handle it right now. Paracetamol only, and only after water stays down.`,

  "Code Red": `WHAT YOU DO NOW
No medication of any kind. Liver is still processing alcohol. Paracetamol + alcohol combination is dangerous. Nothing until substantial water and food are down.

Hydration: 100ml water every 15 minutes. Sipping only. If nausea returns, stop and wait 10 minutes before resuming.

WHAT COMES NEXT
Company: Do not be alone if still feeling disoriented.

Today: Cancel everything. No negotiation. Script: "Really sorry, not well today — can we reschedule?"

No caffeine, no food, no screens until nausea has been fully absent for at least one hour.

THE TRUTH ABOUT TODAY
Goal: Sleep. Nothing else matters today.

WATCH OUT FOR
If you are experiencing chest pain, difficulty breathing, persistent vomiting you cannot stop, or cannot keep any liquid down after 3 hours — this is a medical situation, not a hangover. Seek help.`,
}

// ── Sssalem voice lines for fallback ────────────────────────────────────────
const SSSALEM_OPENINGS: Record<string, string> = {
  "Walking Wounded": "You are barely wounded. I have seen worse after a Tuesday.",
  "Standard Suffering": "A familiar place. Sssalem has been here himself. More than once.",
  "Crisis Mode": "Sit down. Do not argue. There is time for arguing tomorrow.",
  "Code Red": "Sssalem is not joking with you now. Read carefully.",
}

const SSSALEM_CLOSINGS: Record<string, string> = {
  "Walking Wounded": "Drink the water. You have already survived the hard part.",
  "Standard Suffering": "The water first. Everything else can wait.",
  "Crisis Mode": "Sleep. It is the only remedy that cannot be rushed.",
  "Code Red": "Water. Safety. Nothing else exists today.",
}

// ── State machine ───────────────────────────────────────────────────────────
type Phase = "intro" | "q1" | "q2" | "q3" | "q4" | "q5" | "loading" | "safety" | "results"

interface State {
  phase: Phase
  answers: Record<string, Answer>
  severity: number
  tier: string
  label: string
  itinerary: string
  source: "claude" | "fallback"
  safetyWater: boolean | null
  safetySafe: boolean | null
  safetyBypassed: boolean
  expandedSections: Set<string>
  copied: boolean
}

type Action =
  | { type: "start" }
  | { type: "answer"; questionId: string; answer: Answer }
  | { type: "set_loading" }
  | { type: "set_results"; itinerary: string; source: "claude" | "fallback" }
  | { type: "safety_water"; value: boolean }
  | { type: "safety_safe"; value: boolean }
  | { type: "safety_bypass" }
  | { type: "toggle_section"; section: string }
  | { type: "set_copied" }
  | { type: "restart" }

const INITIAL_STATE: State = {
  phase: "intro",
  answers: {},
  severity: 0,
  tier: "",
  label: "",
  itinerary: "",
  source: "fallback",
  safetyWater: null,
  safetySafe: null,
  safetyBypassed: false,
  expandedSections: new Set(),
  copied: false,
}

const PHASE_ORDER: Phase[] = ["intro", "q1", "q2", "q3", "q4", "q5", "loading"]

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start":
      return { ...state, phase: "q1" }

    case "answer": {
      const answers = { ...state.answers, [action.questionId]: action.answer }
      const currentIdx = PHASE_ORDER.indexOf(state.phase)
      const nextPhase = PHASE_ORDER[currentIdx + 1]
      if (nextPhase === "loading") {
        const raw = (answers.q1?.score ?? 0) + (answers.q2?.score ?? 0) + (answers.q3?.score ?? 0) + (answers.q4?.score ?? 0)
        const { severity, tier, label } = computeSeverity(raw)
        return { ...state, answers, severity, tier, label, phase: "loading" }
      }
      return { ...state, answers, phase: nextPhase as Phase }
    }

    case "set_results": {
      const needsSafety = state.severity >= 9
      return {
        ...state,
        itinerary: action.itinerary,
        source: action.source,
        phase: needsSafety ? "safety" : "results",
      }
    }

    case "safety_water":
      return { ...state, safetyWater: action.value }

    case "safety_safe":
      return { ...state, safetySafe: action.value }

    case "safety_bypass":
      return { ...state, safetyBypassed: true, phase: "results" }

    case "toggle_section": {
      const next = new Set(state.expandedSections)
      if (next.has(action.section)) next.delete(action.section)
      else next.add(action.section)
      return { ...state, expandedSections: next }
    }

    case "set_copied":
      return { ...state, copied: true }

    case "restart":
      return { ...INITIAL_STATE }

    default:
      return state
  }
}

// ── Animations ──────────────────────────────────────────────────────────────
const fadeSlideIn = `
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
`

// ── Component ───────────────────────────────────────────────────────────────
export default function HangoverHelper() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  const fetchItinerary = useCallback(async (s: State) => {
    try {
      const res = await fetch("/api/hangover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q1: s.answers.q1,
          q2: s.answers.q2,
          q3: s.answers.q3,
          q4: s.answers.q4,
          q5: s.answers.q5,
          severity: s.severity,
          tier: s.tier,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.itinerary) {
          dispatch({ type: "set_results", itinerary: data.itinerary, source: "claude" })
          return
        }
      }
    } catch {
      // fall through to fallback
    }
    // Fallback
    const opening = SSSALEM_OPENINGS[s.tier] ?? ""
    const body = FALLBACK_ITINERARIES[s.tier] ?? ""
    const closing = SSSALEM_CLOSINGS[s.tier] ?? ""
    const hat = getHatHook(s.severity)
    const fallback = `SEVERITY: ${s.severity}/10 — ${s.label}\n\n${opening}\n\n${body}\n\n${closing}\n\nSssalem's remedy comes with one condition. You leave here with a hat. → ${hat}`
    dispatch({ type: "set_results", itinerary: fallback, source: "fallback" })
  }, [])

  // Trigger API call when loading phase begins
  const handleAnswer = useCallback(
    (questionId: string, answer: Answer) => {
      const nextAnswers = { ...state.answers, [questionId]: answer }
      const isLast = questionId === "q5"

      dispatch({ type: "answer", questionId, answer })

      if (isLast) {
        // Compute severity inline to pass to fetch
        const raw = (nextAnswers.q1?.score ?? 0) + (nextAnswers.q2?.score ?? 0) + (nextAnswers.q3?.score ?? 0) + (nextAnswers.q4?.score ?? 0)
        const computed = computeSeverity(raw)
        const fakeState: State = {
          ...state,
          answers: nextAnswers,
          ...computed,
          phase: "loading",
          itinerary: "",
          source: "fallback",
          safetyWater: null,
          safetySafe: null,
          safetyBypassed: false,
          expandedSections: new Set(),
          copied: false,
        }
        // Small delay for the loading screen to render
        setTimeout(() => fetchItinerary(fakeState), 1800)
      }
    },
    [state, fetchItinerary],
  )

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(state.itinerary)
      dispatch({ type: "set_copied" })
      setTimeout(() => dispatch({ type: "restart" }), 0) // reset copied on next restart
    } catch {
      // Clipboard not available
    }
  }, [state.itinerary])

  const safetyPassed =
    state.safetyWater === true && state.safetySafe === true
  const safetyFailed =
    state.safetyWater === false || state.safetySafe === false

  // ── Render helpers ──────────────────────────────────────────────────────
  const renderScreen = () => {
    switch (state.phase) {
      case "intro":
        return <IntroScreen onStart={() => dispatch({ type: "start" })} />
      case "q1":
      case "q2":
      case "q3":
      case "q4":
      case "q5": {
        const idx = parseInt(state.phase[1]) - 1
        const q = QUESTIONS[idx]
        return (
          <QuestionScreen
            key={state.phase}
            question={q}
            onAnswer={(a) => handleAnswer(q.id, a)}
          />
        )
      }
      case "loading":
        return <LoadingScreen />
      case "safety":
        return (
          <SafetyScreen
            safetyWater={state.safetyWater}
            safetySafe={state.safetySafe}
            safetyPassed={safetyPassed}
            safetyFailed={safetyFailed}
            onWater={(v) => dispatch({ type: "safety_water", value: v })}
            onSafe={(v) => dispatch({ type: "safety_safe", value: v })}
            onProceed={() => dispatch({ type: "set_results", itinerary: state.itinerary, source: state.source })}
            onBypass={() => dispatch({ type: "safety_bypass" })}
            severity={state.severity}
            label={state.label}
          />
        )
      case "results":
        return (
          <ResultsScreen
            state={state}
            onToggle={(s) => dispatch({ type: "toggle_section", section: s })}
            onCopy={handleCopy}
            onRestart={() => dispatch({ type: "restart" })}
          />
        )
      default:
        return null
    }
  }

  return (
    <div
      style={{ background: C.bg, color: C.text }}
      className="min-h-screen flex flex-col"
    >
      <style dangerouslySetInnerHTML={{ __html: fadeSlideIn }} />

      {/* Nav */}
      <header
        style={{ borderBottom: `1px solid ${C.border}` }}
        className="px-4 sm:px-6 py-3 flex items-center justify-between"
      >
        <Link
          href="/"
          className="text-xs font-mono hover:opacity-70 transition-opacity"
          style={{ color: C.muted }}
        >
          randomorium.ai
        </Link>
        <a
          href="https://shop.randomorium.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-3 py-1.5 rounded-full transition-colors"
          style={{ background: C.teal, color: "#fff" }}
        >
          buy a hat
        </a>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-16">
        <div className="w-full max-w-md">{renderScreen()}</div>
      </main>

      {/* Footer */}
      <footer
        className="px-4 sm:px-6 py-4 text-center"
        style={{ borderTop: `1px solid ${C.border}` }}
      >
        <p className="text-[11px] italic" style={{ color: C.muted }}>
          This is recovery guidance, not medical advice. If you are genuinely
          unwell, seek help.
        </p>
      </footer>
    </div>
  )
}

// ── Intro Screen ────────────────────────────────────────────────────────────
function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div
      key="intro"
      className="text-center"
      style={{ animation: "fadeSlideIn 600ms ease-out" }}
    >
      <div
        className="text-5xl mb-6"
        style={{ filter: "grayscale(0.3)" }}
      >
        🧪
      </div>
      <h1
        className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3"
        style={{ color: C.cream }}
      >
        Hangover Helper
      </h1>
      <p
        className="text-sm mb-2 leading-relaxed"
        style={{ color: C.text }}
      >
        Five questions. One recovery plan.
      </p>
      <p
        className="text-xs mb-8 italic"
        style={{ color: C.muted }}
      >
        &ldquo;Ah. I see you found the bottle before the bottle found you.&rdquo;
      </p>
      <button
        onClick={onStart}
        className="w-full py-4 rounded-lg text-base font-medium transition-all cursor-pointer"
        style={{
          background: C.teal,
          color: "#fff",
          minHeight: "52px",
        }}
      >
        Diagnose me
      </button>
    </div>
  )
}

// ── Question Screen ─────────────────────────────────────────────────────────
function QuestionScreen({
  question,
  onAnswer,
}: {
  question: Question
  onAnswer: (a: Answer) => void
}) {
  return (
    <div
      key={question.id}
      style={{ animation: "fadeSlideIn 500ms ease-out" }}
    >
      <p
        className="text-xl sm:text-2xl font-medium mb-8 leading-snug"
        style={{ color: C.cream }}
      >
        {question.text}
      </p>
      <div className="space-y-3">
        {question.answers.map((a) => (
          <button
            key={a.label}
            onClick={() => onAnswer(a)}
            className="w-full text-left px-5 py-4 rounded-lg transition-all cursor-pointer"
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              color: C.text,
              fontSize: "16px",
              minHeight: "52px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.teal
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Loading Screen ──────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div
      key="loading"
      className="text-center"
      style={{ animation: "fadeSlideIn 600ms ease-out" }}
    >
      <div className="text-4xl mb-6" style={{ animation: "fadeSlideIn 1s ease-in-out infinite alternate" }}>
        🍶
      </div>
      <p className="text-base italic" style={{ color: C.cream }}>
        Consulting the ancient remedies...
      </p>
    </div>
  )
}

// ── Safety Screen (Tier 4 only) ─────────────────────────────────────────────
function SafetyScreen({
  safetyWater,
  safetySafe,
  safetyPassed,
  safetyFailed,
  onWater,
  onSafe,
  onProceed,
  onBypass,
  severity,
  label,
}: {
  safetyWater: boolean | null
  safetySafe: boolean | null
  safetyPassed: boolean
  safetyFailed: boolean
  onWater: (v: boolean) => void
  onSafe: (v: boolean) => void
  onProceed: () => void
  onBypass: () => void
  severity: number
  label: string
}) {
  return (
    <div
      key="safety"
      style={{ animation: "fadeSlideIn 600ms ease-out" }}
    >
      <div className="text-center mb-8">
        <p className="text-lg font-semibold" style={{ color: C.danger }}>
          SEVERITY: {severity}/10 — {label}
        </p>
        <p className="text-sm mt-2 italic" style={{ color: C.cream }}>
          Sssalem is not joking with you now. Read carefully.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <p className="text-base mb-3" style={{ color: C.cream }}>
            Have you had any water in the last hour?
          </p>
          <div className="flex gap-3">
            <SafetyButton selected={safetyWater === true} onClick={() => onWater(true)} label="Yes" />
            <SafetyButton selected={safetyWater === false} onClick={() => onWater(false)} label="No" />
          </div>
        </div>

        <div>
          <p className="text-base mb-3" style={{ color: C.cream }}>
            Are you somewhere safe?
          </p>
          <div className="flex gap-3">
            <SafetyButton selected={safetySafe === true} onClick={() => onSafe(true)} label="Yes" />
            <SafetyButton selected={safetySafe === false} onClick={() => onSafe(false)} label="No" />
          </div>
        </div>
      </div>

      {safetyFailed && (
        <div
          className="rounded-lg p-5 mb-6"
          style={{
            background: "rgba(232, 93, 93, 0.1)",
            border: `1px solid ${C.danger}`,
            animation: "fadeSlideIn 400ms ease-out",
          }}
        >
          {safetyWater === false && (
            <p className="text-sm mb-3" style={{ color: C.text }}>
              Drink 200ml of water right now. Sip slowly over 10 minutes. This is the single most important thing you can do.
            </p>
          )}
          {safetySafe === false && (
            <p className="text-sm mb-3" style={{ color: C.text }}>
              Get to a safe location first. Call someone you trust. Do not be alone if you are feeling disoriented.
            </p>
          )}
          <p className="text-xs font-semibold mt-3" style={{ color: C.danger }}>
            If you are experiencing chest pain, difficulty breathing, persistent vomiting you cannot stop, or cannot keep any liquid down after 3 hours — this is a medical situation, not a hangover. Seek help.
          </p>
          <button
            onClick={onBypass}
            className="mt-4 text-xs underline cursor-pointer"
            style={{ color: C.muted }}
          >
            Show plan anyway
          </button>
        </div>
      )}

      {safetyPassed && (
        <button
          onClick={onProceed}
          className="w-full py-4 rounded-lg text-base font-medium transition-all cursor-pointer"
          style={{
            background: C.teal,
            color: "#fff",
            minHeight: "52px",
            animation: "fadeSlideIn 400ms ease-out",
          }}
        >
          Show my recovery plan
        </button>
      )}
    </div>
  )
}

function SafetyButton({
  selected,
  onClick,
  label,
}: {
  selected: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer"
      style={{
        background: selected ? C.teal : C.surface,
        border: `1px solid ${selected ? C.teal : C.border}`,
        color: selected ? "#fff" : C.text,
        minHeight: "52px",
      }}
    >
      {label}
    </button>
  )
}

// ── Results Screen ──────────────────────────────────────────────────────────
function ResultsScreen({
  state,
  onToggle,
  onCopy,
  onRestart,
}: {
  state: State
  onToggle: (s: string) => void
  onCopy: () => void
  onRestart: () => void
}) {
  const hat = getHatHook(state.severity)

  // Parse itinerary into sections
  const sections = parseItinerary(state.itinerary)

  return (
    <div
      key="results"
      style={{ animation: "fadeSlideIn 600ms ease-out" }}
    >
      {/* Severity header */}
      <div className="text-center mb-6">
        <p
          className="text-lg font-semibold"
          style={{ color: state.severity >= 7 ? C.danger : state.severity >= 4 ? C.amber : C.teal }}
        >
          SEVERITY: {state.severity}/10
        </p>
        <p className="text-sm mt-1" style={{ color: C.cream }}>
          {state.label}
        </p>
      </div>

      {/* Opening line (first non-header line if from Claude, or known line) */}
      {sections.opening && (
        <p className="text-sm italic mb-6 text-center" style={{ color: C.muted }}>
          {sections.opening}
        </p>
      )}

      {/* Collapsible sections */}
      <div className="space-y-2 mb-6">
        {sections.blocks.map((block) => {
          const isOpen = state.expandedSections.has(block.title)
          return (
            <div
              key={block.title}
              className="rounded-lg overflow-hidden"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}
            >
              <button
                onClick={() => onToggle(block.title)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left cursor-pointer"
                style={{ color: C.cream, minHeight: "52px" }}
              >
                <span className="text-sm font-semibold tracking-wide">
                  {block.title}
                </span>
                <span
                  className="text-xs transition-transform"
                  style={{
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transitionDuration: "400ms",
                    color: C.muted,
                  }}
                >
                  ▼
                </span>
              </button>
              {isOpen && (
                <div
                  className="px-4 pb-4"
                  style={{ animation: "fadeSlideIn 400ms ease-out" }}
                >
                  <p
                    className="text-sm leading-relaxed whitespace-pre-line"
                    style={{ color: C.text }}
                  >
                    {block.content}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Closing line */}
      {sections.closing && (
        <p className="text-sm italic mb-6 text-center" style={{ color: C.muted }}>
          {sections.closing}
        </p>
      )}

      {/* Hat hook */}
      <div
        className="rounded-lg p-5 mb-6 text-center"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}
      >
        <p className="text-sm italic mb-3" style={{ color: C.cream }}>
          Sssalem&apos;s remedy comes with one condition. You leave here with a hat.
        </p>
        <a
          href="https://shop.randomorium.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-5 py-3 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: C.amber,
            color: "#000",
            minHeight: "44px",
          }}
        >
          {hat} →
        </a>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={onCopy}
          className="w-full py-3.5 rounded-lg text-sm font-medium transition-all cursor-pointer"
          style={{
            background: C.teal,
            color: "#fff",
            minHeight: "52px",
          }}
        >
          {state.copied ? "Copied!" : "Copy full plan"}
        </button>
        <button
          onClick={onRestart}
          className="w-full py-3.5 rounded-lg text-sm transition-colors cursor-pointer"
          style={{
            border: `1px solid ${C.border}`,
            color: C.muted,
            minHeight: "52px",
          }}
        >
          Start over
        </button>
      </div>
    </div>
  )
}

// ── Itinerary parser ────────────────────────────────────────────────────────
interface ParsedItinerary {
  opening: string
  blocks: { title: string; content: string }[]
  closing: string
}

const SECTION_HEADERS = ["WHAT YOU DO NOW", "WHAT COMES NEXT", "THE TRUTH ABOUT TODAY", "WATCH OUT FOR"]

function parseItinerary(text: string): ParsedItinerary {
  const lines = text.split("\n")
  let opening = ""
  let closing = ""
  const blocks: { title: string; content: string }[] = []

  let currentBlock: { title: string; lines: string[] } | null = null
  let foundFirstSection = false
  const preLines: string[] = []
  const allLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip SEVERITY line
    if (trimmed.startsWith("SEVERITY:")) continue

    // Check if it's a section header
    const isHeader = SECTION_HEADERS.some(
      (h) => trimmed === h || trimmed.startsWith(h + ":") || trimmed.startsWith(h + " "),
    )

    if (isHeader) {
      if (currentBlock) {
        blocks.push({ title: currentBlock.title, content: currentBlock.lines.join("\n").trim() })
      }
      const matchedHeader = SECTION_HEADERS.find(
        (h) => trimmed === h || trimmed.startsWith(h + ":") || trimmed.startsWith(h + " "),
      )!
      const rest = trimmed.slice(matchedHeader.length).replace(/^[:\s]+/, "").trim()
      currentBlock = { title: matchedHeader, lines: rest ? [rest] : [] }
      foundFirstSection = true
      continue
    }

    if (!foundFirstSection) {
      if (trimmed) preLines.push(trimmed)
    } else if (currentBlock) {
      currentBlock.lines.push(line)
    } else {
      allLines.push(line)
    }
  }

  if (currentBlock) {
    blocks.push({ title: currentBlock.title, content: currentBlock.lines.join("\n").trim() })
  }

  // Opening = first pre-section non-empty line
  opening = preLines[0] ?? ""

  // Closing = last block's last line if it looks like a Sssalem line, or last pre-section line
  // Try to detect the closing + hat line at the end of the last block
  if (blocks.length > 0) {
    const lastBlock = blocks[blocks.length - 1]
    const lastBlockLines = lastBlock.content.split("\n")
    const closingLines: string[] = []
    // Walk backwards to find Sssalem closing / hat lines
    while (lastBlockLines.length > 0) {
      const last = lastBlockLines[lastBlockLines.length - 1].trim()
      if (!last) {
        lastBlockLines.pop()
        continue
      }
      if (last.includes("Sssalem") || last.includes("hat") || last.includes("remedy") || last.includes("Water.") || last.includes("Sleep.") || last.includes("Drink the")) {
        closingLines.unshift(lastBlockLines.pop()!.trim())
      } else {
        break
      }
    }
    if (closingLines.length > 0) {
      closing = closingLines[0]
      lastBlock.content = lastBlockLines.join("\n").trim()
    }
  }

  // If no sections found, treat the whole thing as a single block
  if (blocks.length === 0 && (preLines.length > 1 || allLines.length > 0)) {
    const all = [...preLines.slice(1), ...allLines].join("\n").trim()
    if (all) {
      blocks.push({ title: "YOUR RECOVERY PLAN", content: all })
    }
  }

  return { opening, blocks, closing }
}
