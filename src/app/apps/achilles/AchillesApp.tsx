'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'achilles_v1'

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#F7F4F0', surface: '#FFFFFF', surfaceAlt: '#F0EDE8', border: '#E8E2DA',
  text: '#2C2A27', textMid: '#6B6560', textDim: '#9E9891',
  strength: '#C17B2F', strengthBg: '#FDF3E7', strengthBorder: '#F0D5A8',
  cardio: '#3A7CA5', cardioBg: '#EAF3FA', cardioBorder: '#B8D8EF',
  mobility: '#6B8F71', mobilityBg: '#EDF4EE', mobilityBorder: '#C0D9C3',
  green: '#4A8C5C', greenBg: '#EDF6F0', greenBorder: '#B8D9C3',
  red: '#C0392B', redBg: '#FDECEC', redBorder: '#F5B7B1',
}

// ── Types ─────────────────────────────────────────────────────────────────────
type SlotType = 'strength' | 'cardio' | 'mobility' | 'rest'
type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
type TabId = 'today' | 'week' | 'records' | 'phases'

interface Slot { type: SlotType; uid: string; cardioName: string | null; cardioId?: string }
interface SetLog { done?: boolean; reps?: string; weight?: string }
type AllLogs = Record<string, SetLog | boolean>
type Schedule = Record<string, Slot[]>

interface BankExercise { id: string; name: string; tags: string[]; location: string }
interface ConfigExercise { bankId: string; id: string; sets: number; reps: number; weight: number; weightUnit: string; weightUnit2: string }
interface CardioOption { bankId: string; id: string; duration: number; durationUnit: string }
interface MonthConfig {
  strength: { timesPerWeek: number; exercises: ConfigExercise[] }
  cardio: { timesPerWeek: number; options: CardioOption[] }
  mobility: { timesPerWeek: number; exercises: ConfigExercise[] }
}
type AppConfig = Record<string, MonthConfig>

interface ResolvedExercise {
  id: string; name: string; location: string; bankId: string
  sets: number; reps: number; weight: number; weightUnit: string; weightUnit2: string
  isCardio?: boolean; duration?: number; durationUnit?: string
}

interface PBEntry { weight: number; reps?: number; date: string }
type PBMap = Record<string, PBEntry>
type PainLog = Record<string, number> // dateKey → 1-5

interface Picker { day: string; avail: SlotType[]; stage?: 'cardio' }

// ── Constants ─────────────────────────────────────────────────────────────────
const PHASES: Record<string, { phase: number; label: string; weeks: string; color: string }> = {
  'April 2026':     { phase: 1, label: 'Mobility & Load',    weeks: 'Weeks 17–20', color: C.mobility },
  'May 2026':       { phase: 2, label: 'Strength Build',     weeks: 'Weeks 21–24', color: C.strength },
  'June 2026':      { phase: 3, label: 'Functional Power',   weeks: 'Weeks 25–28', color: C.strength },
  'July 2026':      { phase: 3, label: 'Power & Agility',    weeks: 'Weeks 29–32', color: C.strength },
  'August 2026':    { phase: 4, label: 'Running Prep',       weeks: 'Weeks 33–36', color: C.cardio },
  'September 2026': { phase: 4, label: 'Building Run Base',  weeks: 'Weeks 37–40', color: C.cardio },
  'October 2026':   { phase: 5, label: 'Return to Run',      weeks: 'Weeks 41–44', color: C.cardio },
  'November 2026':  { phase: 5, label: 'Extending Distance', weeks: 'Weeks 45–48', color: C.cardio },
  'December 2026':  { phase: 6, label: '🎯 5km Goal',        weeks: 'Weeks 49–52', color: C.green },
}
const MONTHS = Object.keys(PHASES)
const DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const PAIN_LABELS = ['', 'None', 'Mild', 'Moderate', 'Strong', 'Severe']
const PAIN_COLORS = ['', C.green, '#7AAE5A', C.strength, '#C17B2F', C.red]

// ── Helpers ───────────────────────────────────────────────────────────────────
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function getMonday(date: Date) {
  const d = new Date(date); d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + (d.getDay() === 0 ? -6 : 1 - d.getDay())); return d
}
function fmtShort(d: Date) { return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }
function wkKey(mon: Date) { return mon.toISOString().slice(0, 10) }
function dateKey(d: Date) { return d.toISOString().slice(0, 10) }
function getCfgMonth(date: Date) {
  const key = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  if (MONTHS.includes(key)) return key
  return date < new Date('April 1 2026') ? MONTHS[0] : MONTHS[MONTHS.length - 1]
}
function slotColors(type: string) {
  return {
    col: C[type as keyof typeof C] as string || C.text,
    bg: C[(type + 'Bg') as keyof typeof C] as string || C.surface,
    bdr: C[(type + 'Border') as keyof typeof C] as string || C.border,
  }
}

// ── Exercise bank & config ────────────────────────────────────────────────────
const DEFAULT_EXERCISES: BankExercise[] = [
  { id: 'bk-ank',   name: 'Ankle DF Lunge Stretch',  tags: ['strength', 'mobility'], location: 'home' },
  { id: 'bk-slcr',  name: 'Single-Leg Calf Raise',   tags: ['strength'],             location: 'home' },
  { id: 'bk-eccl',  name: 'Eccentric Calf Lower',     tags: ['strength'],             location: 'home' },
  { id: 'bk-dlbr',  name: 'Double-Leg Bridge',        tags: ['strength'],             location: 'home' },
  { id: 'bk-slbr',  name: 'Single-Leg Bridge',        tags: ['strength'],             location: 'home' },
  { id: 'bk-sqs',   name: 'Squat',                    tags: ['strength'],             location: 'home' },
  { id: 'bk-spls',  name: 'Split Squat',              tags: ['strength'],             location: 'home' },
  { id: 'bk-plk',   name: 'Plank',                    tags: ['strength'],             location: 'home' },
  { id: 'bk-sldl',  name: 'Stiff-Leg Deadlift',       tags: ['strength'],             location: 'home' },
  { id: 'bk-star',  name: 'Star Excursion Balance',   tags: ['strength', 'mobility'], location: 'home' },
  { id: 'bk-knem',  name: 'Knee Extension Machine',   tags: ['strength'],             location: 'gym'  },
  { id: 'bk-bike',  name: 'Static Bike',              tags: ['cardio'],               location: 'gym'  },
  { id: 'bk-step',  name: 'Stepper',                  tags: ['cardio'],               location: 'gym'  },
  { id: 'bk-sol',   name: 'Soleus Stretch',           tags: ['mobility'],             location: 'home' },
  { id: 'bk-slbal', name: 'Single-Leg Balance',       tags: ['mobility', 'strength'], location: 'home' },
  { id: 'bk-dynbl', name: 'Dynamic Balance',          tags: ['mobility', 'strength'], location: 'home' },
]

function makeDefaultConfig(): AppConfig {
  const cfg: AppConfig = {}
  MONTHS.forEach(m => {
    cfg[m] = {
      strength: {
        timesPerWeek: 3,
        exercises: [
          { bankId: 'bk-ank',  id: 'e-ank',  sets: 3, reps: 30, weight: 0,  weightUnit: 'sec',  weightUnit2: 'per side' },
          { bankId: 'bk-slcr', id: 'e-slcr', sets: 3, reps: 15, weight: 0,  weightUnit: 'reps', weightUnit2: 'BW' },
          { bankId: 'bk-eccl', id: 'e-eccl', sets: 3, reps: 15, weight: 0,  weightUnit: 'reps', weightUnit2: 'BW' },
          { bankId: 'bk-dlbr', id: 'e-dlbr', sets: 3, reps: 15, weight: 0,  weightUnit: 'reps', weightUnit2: 'BW' },
          { bankId: 'bk-slbr', id: 'e-slbr', sets: 3, reps: 12, weight: 0,  weightUnit: 'reps', weightUnit2: 'BW' },
          { bankId: 'bk-sqs',  id: 'e-sqs',  sets: 3, reps: 10, weight: 5,  weightUnit: 'reps', weightUnit2: 'kg' },
          { bankId: 'bk-spls', id: 'e-spls', sets: 3, reps: 10, weight: 5,  weightUnit: 'reps', weightUnit2: 'kg' },
          { bankId: 'bk-knem', id: 'e-knem', sets: 3, reps: 6,  weight: 45, weightUnit: 'reps', weightUnit2: 'kg' },
          { bankId: 'bk-sldl', id: 'e-sldl', sets: 3, reps: 10, weight: 12, weightUnit: 'reps', weightUnit2: 'kg' },
          { bankId: 'bk-plk',  id: 'e-plk',  sets: 3, reps: 30, weight: 0,  weightUnit: 'sec',  weightUnit2: '—' },
        ],
      },
      cardio: {
        timesPerWeek: 2,
        options: [
          { bankId: 'bk-bike', id: 'c-bike', duration: 25, durationUnit: 'min' },
          { bankId: 'bk-step', id: 'c-step', duration: 20, durationUnit: 'min' },
        ],
      },
      mobility: {
        timesPerWeek: 7,
        exercises: [
          { bankId: 'bk-sol',   id: 'm-sol',   sets: 2, reps: 30, weight: 0, weightUnit: 'sec',  weightUnit2: 'per side' },
          { bankId: 'bk-slbal', id: 'm-slbal', sets: 1, reps: 60, weight: 0, weightUnit: 'sec',  weightUnit2: '—' },
          { bankId: 'bk-dynbl', id: 'm-dynbl', sets: 3, reps: 10, weight: 0, weightUnit: 'reps', weightUnit2: '—' },
        ],
      },
    }
  })
  return cfg
}

function defaultSched(): Schedule {
  const s: Schedule = {}
  DAYS.forEach(d => { s[d] = [{ type: 'mobility', uid: `${d}-m`, cardioName: null }] })
  return s
}

function resolveEx(cfgEx: ConfigExercise | CardioOption, bank: BankExercise[]): ResolvedExercise {
  const bk = bank.find(b => b.id === cfgEx.bankId)
  const ex = cfgEx as ConfigExercise
  const co = cfgEx as CardioOption
  return {
    id: cfgEx.id, bankId: cfgEx.bankId, name: bk?.name || 'Exercise', location: bk?.location || 'home',
    sets: ex.sets ?? 1, reps: ex.reps ?? 0, weight: ex.weight ?? 0,
    weightUnit: ex.weightUnit || '', weightUnit2: ex.weightUnit2 || '',
    duration: co.duration, durationUnit: co.durationUnit,
  }
}

function getExFromSlot(slot: Slot, cfg: MonthConfig, bank: BankExercise[]): ResolvedExercise[] {
  if (slot.type === 'strength') return cfg.strength.exercises.map(e => resolveEx(e, bank))
  if (slot.type === 'mobility') return cfg.mobility.exercises.map(e => resolveEx(e, bank))
  if (slot.type === 'cardio') {
    const op = cfg.cardio.options.find(o => o.id === slot.cardioId) || cfg.cardio.options[0]
    if (!op) return []
    return [{ ...resolveEx(op, bank), sets: 1, reps: 0, weight: 0, weightUnit: '', weightUnit2: '', isCardio: true }]
  }
  return []
}

// ── Trophies ──────────────────────────────────────────────────────────────────
interface Trophy { id: string; emoji: string; name: string; desc: string; unlocked: boolean }

function computeTrophies(allLogs: AllLogs, pbs: PBMap, painLogs: PainLog): Trophy[] {
  const doneSets = Object.entries(allLogs).filter(([k, v]) =>
    !k.endsWith('__skipped') && typeof v === 'object' && (v as SetLog).done
  )
  const totalDone = doneSets.length
  const hasPB = Object.keys(pbs).length > 0
  const hasPainLog = Object.keys(painLogs).length > 0
  const lowPain = Object.values(painLogs).some(p => p <= 2)
  const hasStrength = doneSets.some(([k]) => k.includes('-strength-') || k.includes('e-'))
  const hasMobility = doneSets.some(([k]) => k.includes('-mobility-') || k.includes('m-'))
  const hasCardio = doneSets.some(([k]) => k.includes('-cardio-') || k.includes('c-'))

  return [
    { id: 'first-steps', emoji: '🏁', name: 'First Steps',      desc: 'Complete your first set',          unlocked: totalDone >= 1 },
    { id: 'strength',    emoji: '💪', name: 'Strength Day',      desc: 'Complete a strength session',      unlocked: hasStrength },
    { id: 'mobility',    emoji: '🧘', name: 'Mobility Matters',  desc: 'Complete a mobility session',      unlocked: hasMobility },
    { id: 'cardio',      emoji: '🚴', name: 'Cardio Day',        desc: 'Complete a cardio session',        unlocked: hasCardio },
    { id: 'pain-track',  emoji: '📊', name: 'Pain Tracker',      desc: 'Log your first pain level',       unlocked: hasPainLog },
    { id: 'pb',          emoji: '🏆', name: 'Personal Best',     desc: 'Set your first personal best',     unlocked: hasPB },
    { id: 'low-pain',    emoji: '😌', name: 'Clean Session',     desc: 'Log pain level ≤ 2',               unlocked: lowPain },
    { id: 'ten-sets',    emoji: '🔥', name: 'Getting Warmed Up', desc: 'Log 10 completed sets total',     unlocked: totalDone >= 10 },
    { id: 'fifty-sets',  emoji: '⚡', name: 'In The Zone',       desc: 'Log 50 completed sets total',     unlocked: totalDone >= 50 },
    { id: 'century',     emoji: '💯', name: 'Century',           desc: 'Log 100 completed sets total',    unlocked: totalDone >= 100 },
    { id: 'phase-4',     emoji: '🏃', name: 'Running Prep',      desc: 'Reach Phase 4 (August 2026)',     unlocked: new Date() >= new Date('August 1 2026') },
    { id: 'phase-5',     emoji: '👟', name: 'Return to Run',     desc: 'Reach Phase 5 (October 2026)',    unlocked: new Date() >= new Date('October 1 2026') },
    { id: 'goal',        emoji: '🎯', name: '5km Goal',          desc: 'Reach Phase 6 (December 2026)',   unlocked: new Date() >= new Date('December 1 2026') },
  ]
}

// ── TODAY TAB ─────────────────────────────────────────────────────────────────
function TodayTab({ sched, config, bank, allLogs, setAllLogs, pbs, setPbs, painLogs, setPainLogs }: {
  sched: Schedule; config: AppConfig; bank: BankExercise[]
  allLogs: AllLogs; setAllLogs: React.Dispatch<React.SetStateAction<AllLogs>>
  pbs: PBMap; setPbs: React.Dispatch<React.SetStateAction<PBMap>>
  painLogs: PainLog; setPainLogs: React.Dispatch<React.SetStateAction<PainLog>>
}) {
  const today = new Date()
  const mon = getMonday(today)
  const wk = wkKey(mon)
  const dk = dateKey(today)
  const dayName = DAYS[(today.getDay() + 6) % 7]
  const cfg = config[getCfgMonth(today)] || config[MONTHS[0]]
  const phase = PHASES[getCfgMonth(today)]
  const slots = (sched[dayName] || []).filter(s => s.type !== 'rest')
  const [newPbFlash, setNewPbFlash] = useState<string | null>(null)

  const getSetLog = (slotUid: string, exId: string, i: number): SetLog => {
    const val = allLogs[`${wk}__${slotUid}__${exId}__${i}`]
    return (typeof val === 'object' && val !== null ? val : {}) as SetLog
  }

  const setSetLog = useCallback((slotUid: string, exId: string, exName: string, i: number, val: SetLog, weightUnit2?: string) => {
    setAllLogs(p => ({ ...p, [`${wk}__${slotUid}__${exId}__${i}`]: val }))
    // PB check — only for weighted exercises when marking done
    if (val.done && val.weight && weightUnit2 !== 'BW' && weightUnit2 !== '—' && weightUnit2 !== 'per side') {
      const w = parseFloat(val.weight)
      if (!isNaN(w) && w > 0) {
        setPbs(p => {
          const cur = p[exId]
          if (!cur || w > cur.weight) {
            setNewPbFlash(exName)
            setTimeout(() => setNewPbFlash(null), 2500)
            return { ...p, [exId]: { weight: w, date: dk } }
          }
          return p
        })
      }
    }
  }, [wk, dk, setPbs, setAllLogs])

  const isSkipped = (slot: Slot) => !!allLogs[`${wk}__${dayName}__${slot.uid}__skipped`]
  const toggleSkipped = (slot: Slot) => setAllLogs(p => {
    const k = `${wk}__${dayName}__${slot.uid}__skipped`
    const n = { ...p }; if (n[k]) delete n[k]; else n[k] = true; return n
  })

  let total = 0, done = 0
  slots.forEach(slot => {
    if (isSkipped(slot)) return
    getExFromSlot(slot, cfg, bank).forEach(ex => {
      const cnt = ex.isCardio ? 1 : (ex.sets || 1)
      total += cnt
      for (let i = 0; i < cnt; i++) if (getSetLog(slot.uid, ex.id, i).done) done++
    })
  })
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const todayPain = painLogs[dk] || 0

  if (slots.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-5" style={{ backgroundColor: C.bg }}>
        <p className="text-xs mb-0.5 font-mono" style={{ color: C.textDim }}>Operation Achilles Rebuild</p>
        <h2 className="text-2xl font-extrabold mb-3" style={{ color: C.text }}>
          {today.toLocaleDateString('en-GB', { weekday: 'long' })}
        </h2>
        {phase && (
          <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: C.strengthBg, border: `1.5px solid ${C.strengthBorder}` }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: C.strength }}>Phase {phase.phase}</p>
            <p className="text-sm font-bold mt-1" style={{ color: C.text }}>{phase.label}</p>
          </div>
        )}
        <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: C.surface, border: `1.5px solid ${C.border}` }}>
          <div className="text-4xl mb-2">🌅</div>
          <p className="font-semibold mb-1" style={{ color: C.text }}>Rest day</p>
          <p className="text-sm" style={{ color: C.textDim }}>Go to the Week tab to plan sessions</p>
        </div>
        <PainSection todayPain={todayPain} onSet={p => setPainLogs(prev => ({ ...prev, [dk]: p }))} />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bg }}>
      {/* PB flash */}
      {newPbFlash && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-white text-xs font-bold shadow-lg"
          style={{ backgroundColor: C.green }}>
          🏆 New PB — {newPbFlash}!
        </div>
      )}

      {/* Session header */}
      <div className="px-4 py-3" style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <p className="text-xs mb-0.5 font-mono" style={{ color: C.textDim }}>Operation Achilles Rebuild</p>
        <h2 className="text-xl font-extrabold" style={{ color: C.text }}>
          {today.toLocaleDateString('en-GB', { weekday: 'long' })}
        </h2>
        <p className="text-xs mb-2" style={{ color: C.textMid }}>
          {today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
          {phase ? ` · Phase ${phase.phase}: ${phase.label}` : ''}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.surfaceAlt }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: pct === 100 ? C.green : C.strength }} />
          </div>
          <span className="text-sm font-bold" style={{ color: pct === 100 ? C.green : C.strength }}>
            {done}/{total}
          </span>
          {pct === 100 && <span className="font-bold" style={{ color: C.green }}>✓</span>}
        </div>
      </div>

      <div className="p-4 pb-4">
        {slots.map(slot => {
          const { col, bg, bdr } = slotColors(slot.type)
          const exercises = getExFromSlot(slot, cfg, bank)
          const label = slot.cardioName || (slot.type[0].toUpperCase() + slot.type.slice(1))
          const skipped = isSkipped(slot)

          return (
            <div key={slot.uid} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 rounded-full px-3 py-1"
                  style={{ backgroundColor: skipped ? C.surfaceAlt : bg, border: `1.5px solid ${skipped ? C.border : bdr}` }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: skipped ? C.textDim : col }} />
                  <span className="text-xs font-bold" style={{ color: skipped ? C.textDim : col }}>{label}</span>
                </div>
                <button onClick={() => toggleSkipped(slot)} className="rounded-xl px-3 py-1 text-xs font-semibold"
                  style={{ backgroundColor: skipped ? C.strengthBg : C.surfaceAlt, border: `1.5px solid ${skipped ? C.strengthBorder : C.border}`, color: skipped ? C.strength : C.textDim }}>
                  {skipped ? 'Restore' : "Didn't do this"}
                </button>
              </div>

              {!skipped && (
                <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${C.border}`, backgroundColor: C.surface }}>
                  {exercises.map((ex, ei) => {
                    const cnt = ex.isCardio ? 1 : (ex.sets || 1)
                    const exDone = Array.from({ length: cnt }, (_, i) => getSetLog(slot.uid, ex.id, i).done).filter(Boolean).length
                    const pb = pbs[ex.id]
                    return (
                      <div key={ex.id} style={{ borderBottom: ei < exercises.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                        <div className="flex justify-between items-start p-3"
                          style={{ backgroundColor: exDone === cnt && cnt > 0 ? bg : C.surface }}>
                          <div>
                            <p className="text-sm font-bold" style={{ color: C.text }}>{ex.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: col }}>
                              {ex.isCardio
                                ? `${ex.duration} ${ex.durationUnit}`
                                : `${ex.sets} × ${ex.reps} ${ex.weightUnit || 'reps'}${ex.weight > 0 ? ` · ${ex.weight} ${ex.weightUnit2}` : ''}`}
                            </p>
                            {pb && (
                              <p className="text-xs mt-1 font-semibold" style={{ color: C.green }}>
                                🏆 PB: {pb.weight}kg
                              </p>
                            )}
                          </div>
                          <span className="text-xs font-semibold mt-0.5 flex-shrink-0"
                            style={{ color: exDone === cnt && cnt > 0 ? C.green : C.textDim }}>
                            {exDone}/{cnt}{exDone === cnt && cnt > 0 ? ' ✓' : ''}
                          </span>
                        </div>

                        {Array.from({ length: cnt }, (_, i) => {
                          const log = getSetLog(slot.uid, ex.id, i)
                          return (
                            <div key={i} className="flex items-center gap-2 px-3 py-2"
                              style={{ borderTop: `1px solid ${C.border}`, backgroundColor: log.done ? C.greenBg : 'transparent' }}>
                              <button
                                onClick={() => setSetLog(slot.uid, ex.id, ex.name, i, { ...log, done: !log.done }, ex.weightUnit2)}
                                className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ border: `2px solid ${log.done ? col : C.border}`, backgroundColor: log.done ? col : C.surface }}>
                                {log.done && <span className="text-white text-xs font-bold">✓</span>}
                              </button>
                              <span className="text-xs font-bold w-10 flex-shrink-0"
                                style={{ color: log.done ? C.green : col }}>Set {i + 1}</span>
                              {!ex.isCardio && (
                                <div className="flex gap-2 flex-1">
                                  <input type="number" inputMode="numeric"
                                    className="flex-1 rounded-lg px-2 py-1 text-xs outline-none text-center"
                                    style={{ backgroundColor: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.text }}
                                    placeholder={`${ex.reps} ${ex.weightUnit}`} value={log.reps ?? ''}
                                    onChange={e => setSetLog(slot.uid, ex.id, ex.name, i, { ...log, reps: e.target.value }, ex.weightUnit2)} />
                                  {ex.weightUnit2 !== 'BW' && ex.weightUnit2 !== '—' && ex.weightUnit2 !== 'per side' && (
                                    <input type="number" inputMode="decimal"
                                      className="flex-1 rounded-lg px-2 py-1 text-xs outline-none text-center"
                                      style={{ backgroundColor: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.text }}
                                      placeholder={`${ex.weight > 0 ? ex.weight : '0'} kg`} value={log.weight ?? ''}
                                      onChange={e => setSetLog(slot.uid, ex.id, ex.name, i, { ...log, weight: e.target.value }, ex.weightUnit2)} />
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )}
              {skipped && (
                <div className="rounded-2xl p-4" style={{ backgroundColor: C.surfaceAlt, border: `1.5px solid ${C.border}` }}>
                  <p className="text-sm italic" style={{ color: C.textDim }}>Session skipped</p>
                </div>
              )}
            </div>
          )
        })}

        <PainSection todayPain={todayPain} onSet={p => setPainLogs(prev => ({ ...prev, [dk]: p }))} />
      </div>
    </div>
  )
}

// ── PAIN SECTION ──────────────────────────────────────────────────────────────
function PainSection({ todayPain, onSet }: { todayPain: number; onSet: (n: number) => void }) {
  return (
    <div className="rounded-2xl p-4 mt-2" style={{ backgroundColor: C.surface, border: `1.5px solid ${C.border}` }}>
      <p className="text-xs font-bold mb-3" style={{ color: C.textMid }}>How&apos;s the pain today?</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => onSet(todayPain === n ? 0 : n)}
            className="flex-1 rounded-xl py-2 text-xs font-bold transition-all"
            style={{
              backgroundColor: todayPain === n ? PAIN_COLORS[n] : C.surfaceAlt,
              color: todayPain === n ? '#fff' : C.textMid,
              border: `1.5px solid ${todayPain === n ? PAIN_COLORS[n] : C.border}`,
            }}>
            {n}<br /><span className="font-normal text-[10px]">{PAIN_LABELS[n]}</span>
          </button>
        ))}
      </div>
      {todayPain > 0 && (
        <p className="text-xs mt-2 text-center" style={{ color: PAIN_COLORS[todayPain] }}>
          Pain logged: {PAIN_LABELS[todayPain]} ({todayPain}/5)
        </p>
      )}
    </div>
  )
}

// ── WEEK TAB ──────────────────────────────────────────────────────────────────
function WeekTab({ weekOffset, setWeekOffset, sched, setSched, config, allLogs, bank }: {
  weekOffset: number; setWeekOffset: React.Dispatch<React.SetStateAction<number>>
  sched: Schedule; setSched: React.Dispatch<React.SetStateAction<Schedule>>
  config: AppConfig; allLogs: AllLogs; bank: BankExercise[]
}) {
  const today = new Date()
  const mon = getMonday(addDays(today, weekOffset * 7))
  const wk = wkKey(mon)
  const cfg = config[getCfgMonth(mon)] || config[MONTHS[0]]
  const phase = PHASES[getCfgMonth(mon)]
  const [picker, setPicker] = useState<Picker | null>(null)

  const addSlot = (day: string, type: SlotType, cardioName: string | null = null) =>
    setSched(p => {
      const slots = p[day] || []
      if (type !== 'rest' && slots.some(s => s.type === type)) return p
      return { ...p, [day]: [...slots, { type, uid: `${day}-${type}-${Date.now()}`, cardioName }] }
    })
  const removeSlot = (day: string, uid: string) =>
    setSched(p => ({ ...p, [day]: (p[day] || []).filter(s => s.uid !== uid) }))

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bg }}>
      <div className="p-4 pb-10">
        {/* Week nav */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setWeekOffset(o => o - 1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ border: `1.5px solid ${C.border}`, backgroundColor: C.surface }}>
            <span style={{ color: C.textMid, fontSize: 20, lineHeight: 1 }}>‹</span>
          </button>
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: C.text }}>{fmtShort(mon)} – {fmtShort(addDays(mon, 6))}</p>
            <p className="text-xs mt-0.5 font-mono" style={{ color: C.textDim }}>{getCfgMonth(mon)}</p>
          </div>
          <button onClick={() => setWeekOffset(o => o + 1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ border: `1.5px solid ${C.border}`, backgroundColor: C.surface }}>
            <span style={{ color: C.textMid, fontSize: 20, lineHeight: 1 }}>›</span>
          </button>
        </div>

        {phase && (
          <div className="rounded-2xl p-3 mb-3"
            style={{ backgroundColor: C.strengthBg, border: `1.5px solid ${C.strengthBorder}` }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: C.strength }}>
              Phase {phase.phase} · {phase.weeks}
            </p>
            <p className="text-sm font-bold mt-0.5" style={{ color: C.text }}>{phase.label}</p>
          </div>
        )}

        {DAYS.map((day, di) => {
          const date = addDays(mon, di)
          const isToday = date.toDateString() === today.toDateString()
          const slots = sched[day] || []
          const active = slots.filter(s => s.type !== 'rest')
          let total = 0, done = 0
          active.forEach(slot => {
            if (allLogs[`${wk}__${day}__${slot.uid}__skipped`]) return
            getExFromSlot(slot, cfg, bank).forEach(ex => {
              const cnt = ex.isCardio ? 1 : (ex.sets || 1)
              total += cnt
              for (let i = 0; i < cnt; i++) {
                const v = allLogs[`${wk}__${slot.uid}__${ex.id}__${i}`]
                if (typeof v === 'object' && v?.done) done++
              }
            })
          })
          const allDone = total > 0 && done === total

          return (
            <div key={day} className="rounded-2xl p-3 mb-2"
              style={{ backgroundColor: C.surface, border: `1.5px solid ${isToday ? C.strengthBorder : allDone ? C.greenBorder : C.border}` }}>
              <div className="flex items-center gap-2">
                <div className="w-12 flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: isToday ? C.strength : C.text }}>{day}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.textDim }}>{fmtShort(date)}</p>
                </div>
                <div className="flex-1 flex flex-wrap gap-1.5">
                  {slots.length === 0
                    ? <span className="text-xs italic" style={{ color: C.textDim }}>Nothing planned</span>
                    : slots.map(sl => {
                        const { col, bg, bdr } = slotColors(sl.type)
                        return (
                          <button key={sl.uid} onDoubleClick={() => removeSlot(day, sl.uid)}
                            title="Double-click to remove"
                            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{ backgroundColor: bg, border: `1.5px solid ${bdr}`, color: col }}>
                            {sl.cardioName || (sl.type[0].toUpperCase() + sl.type.slice(1))}
                            <span className="opacity-40">×</span>
                          </button>
                        )
                      })}
                </div>
                <button
                  onClick={() => setPicker({ day, avail: (['strength', 'cardio', 'mobility', 'rest'] as SlotType[]).filter(t => !slots.some(s => s.type === t)) })}
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ border: `1.5px solid ${C.border}`, backgroundColor: C.surfaceAlt }}>
                  <span style={{ color: C.textMid, fontSize: 16, lineHeight: 1 }}>+</span>
                </button>
              </div>
              {total > 0 && !allDone && (
                <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: C.surfaceAlt }}>
                  <div className="h-full rounded-full"
                    style={{ width: `${Math.round((done / total) * 100)}%`, backgroundColor: C.strength }} />
                </div>
              )}
              {allDone && <p className="text-xs font-bold mt-1.5" style={{ color: C.green }}>✓ Complete</p>}
              <p className="text-xs mt-1.5" style={{ color: C.textDim }}>Double-click a session pill to remove</p>
            </div>
          )
        })}
      </div>

      {/* Bottom sheet picker */}
      {picker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setPicker(null)}>
          <div className="w-full rounded-t-2xl p-5" onClick={e => e.stopPropagation()}
            style={{ maxWidth: 480, backgroundColor: C.surface, borderTop: `1px solid ${C.border}` }}>
            <p className="font-bold mb-3" style={{ color: C.text }}>
              {picker.stage === 'cardio' ? `Cardio for ${picker.day}` : `Add to ${picker.day}`}
            </p>
            {picker.stage === 'cardio'
              ? cfg.cardio.options.map(opt => {
                  const name = bank.find(b => b.id === opt.bankId)?.name || opt.id
                  return (
                    <button key={opt.id} onClick={() => { addSlot(picker.day, 'cardio', name); setPicker(null) }}
                      className="w-full text-left p-3.5 rounded-xl mb-2 text-sm font-semibold"
                      style={{ backgroundColor: C.surfaceAlt, color: C.cardio }}>
                      {name} · {opt.duration} {opt.durationUnit}
                    </button>
                  )
                })
              : picker.avail.map(type => (
                  <button key={type} onClick={() => {
                    if (type === 'cardio' && cfg.cardio.options.length > 1) {
                      setPicker({ ...picker, stage: 'cardio' })
                    } else if (type === 'cardio') {
                      const name = bank.find(b => b.id === cfg.cardio.options[0].bankId)?.name || ''
                      addSlot(picker.day, 'cardio', name); setPicker(null)
                    } else {
                      addSlot(picker.day, type); setPicker(null)
                    }
                  }}
                    className="w-full text-left p-3.5 rounded-xl mb-2 text-sm font-semibold capitalize"
                    style={{ backgroundColor: C.surfaceAlt, color: slotColors(type).col }}>
                    {type}
                  </button>
                ))}
            <button onClick={() => setPicker(null)} className="w-full p-3.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: C.surfaceAlt, color: C.textMid }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── RECORDS TAB ───────────────────────────────────────────────────────────────
function RecordsTab({ pbs, painLogs, allLogs, bank }: {
  pbs: PBMap; painLogs: PainLog; allLogs: AllLogs; bank: BankExercise[]
}) {
  const trophies = computeTrophies(allLogs, pbs, painLogs)
  const unlockedCount = trophies.filter(t => t.unlocked).length
  const weightedExercises = bank.filter(b => !['bk-bike', 'bk-step', 'bk-sol', 'bk-slbal', 'bk-dynbl'].includes(b.id))

  const painEntries = Object.entries(painLogs).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7)
  const avgPain = painEntries.length > 0
    ? (painEntries.reduce((s, [, v]) => s + v, 0) / painEntries.length).toFixed(1)
    : null

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-10" style={{ backgroundColor: C.bg }}>

      {/* Trophies */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-sm font-bold" style={{ color: C.text }}>Trophies</h3>
          <span className="text-xs font-mono" style={{ color: C.textDim }}>{unlockedCount}/{trophies.length}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {trophies.map(t => (
            <div key={t.id} className="rounded-2xl p-3 text-center"
              style={{
                backgroundColor: t.unlocked ? C.surface : C.surfaceAlt,
                border: `1.5px solid ${t.unlocked ? C.greenBorder : C.border}`,
                opacity: t.unlocked ? 1 : 0.5,
              }}>
              <div className="text-2xl mb-1">{t.unlocked ? t.emoji : '🔒'}</div>
              <p className="text-xs font-bold leading-tight" style={{ color: t.unlocked ? C.text : C.textDim }}>{t.name}</p>
              <p className="text-[10px] mt-0.5 leading-tight" style={{ color: C.textDim }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Bests */}
      <div className="mb-6">
        <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Personal Bests</h3>
        {Object.keys(pbs).length === 0 ? (
          <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: C.surface, border: `1.5px solid ${C.border}` }}>
            <p className="text-sm" style={{ color: C.textDim }}>No PBs yet — start logging weights!</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${C.border}`, backgroundColor: C.surface }}>
            {weightedExercises.filter(e => pbs[e.id.replace('bk-', 'e-')] || pbs[e.id]).map((ex, i, arr) => {
              const pb = pbs[ex.id.replace('bk-', 'e-')] || pbs[ex.id]
              if (!pb) return null
              return (
                <div key={ex.id} className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <p className="text-sm" style={{ color: C.text }}>{ex.name}</p>
                  <div className="text-right">
                    <span className="text-sm font-bold" style={{ color: C.green }}>{pb.weight} kg</span>
                    <p className="text-xs" style={{ color: C.textDim }}>{pb.date}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pain trend */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-sm font-bold" style={{ color: C.text }}>Pain Log</h3>
          {avgPain && <span className="text-xs font-mono" style={{ color: C.textDim }}>7-day avg: {avgPain}/5</span>}
        </div>
        {painEntries.length === 0 ? (
          <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: C.surface, border: `1.5px solid ${C.border}` }}>
            <p className="text-sm" style={{ color: C.textDim }}>Log pain levels on the Today tab</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${C.border}`, backgroundColor: C.surface }}>
            {painEntries.map(([dk, pain], i) => (
              <div key={dk} className="flex items-center justify-between px-4 py-2.5"
                style={{ borderBottom: i < painEntries.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <p className="text-sm font-mono" style={{ color: C.textMid }}>{dk}</p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <div key={n} className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: n <= pain ? PAIN_COLORS[pain] : C.surfaceAlt }} />
                    ))}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: PAIN_COLORS[pain] }}>
                    {PAIN_LABELS[pain]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── PHASES TAB ────────────────────────────────────────────────────────────────
function PhasesTab() {
  const today = new Date()
  const currentMonth = getCfgMonth(today)

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-10" style={{ backgroundColor: C.bg }}>
      <h2 className="text-xl font-bold mb-1" style={{ color: C.text }}>Phase schedule</h2>
      <p className="text-sm mb-4 font-mono" style={{ color: C.textDim }}>April – December 2026 · 5km goal</p>
      {MONTHS.map(m => {
        const p = PHASES[m]
        const isCurrent = m === currentMonth
        const isPast = new Date(m) < new Date(currentMonth)
        return (
          <div key={m} className="rounded-2xl p-4 mb-2"
            style={{
              backgroundColor: isCurrent ? C.strengthBg : isPast ? C.greenBg : C.surface,
              border: `1.5px solid ${isCurrent ? C.strengthBorder : isPast ? C.greenBorder : C.border}`,
            }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: isCurrent ? C.strength : isPast ? C.green : p.color }}>
                  Phase {p.phase} · {p.weeks}
                </p>
                <p className="text-sm font-bold mt-1" style={{ color: C.text }}>{m}</p>
                <p className="text-xs mt-0.5" style={{ color: C.textMid }}>{p.label}</p>
              </div>
              {isCurrent && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: C.strength, color: '#fff' }}>Now</span>}
              {isPast && <span className="text-xs" style={{ color: C.green }}>✓</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function AchillesApp() {
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState<TabId>('today')
  const [weekOffset, setWeekOffset] = useState(0)
  const [sched, setSched] = useState<Schedule>(defaultSched)
  const [allLogs, setAllLogs] = useState<AllLogs>({})
  const [pbs, setPbs] = useState<PBMap>({})
  const [painLogs, setPainLogs] = useState<PainLog>({})
  const [config] = useState<AppConfig>(makeDefaultConfig)
  const [bank] = useState<BankExercise[]>(DEFAULT_EXERCISES)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const s = JSON.parse(saved)
        if (s.sched) setSched(s.sched)
        if (s.allLogs) setAllLogs(s.allLogs)
        if (s.pbs) setPbs(s.pbs)
        if (s.painLogs) setPainLogs(s.painLogs)
      }
    } catch { /* ignore */ }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sched, allLogs, pbs, painLogs }))
  }, [sched, allLogs, pbs, painLogs, ready])

  if (!ready) return (
    <div className="flex items-center justify-center" style={{ height: '100dvh', backgroundColor: C.bg }}>
      <p className="font-mono text-sm" style={{ color: C.textDim }}>Loading…</p>
    </div>
  )

  const TABS: [TabId, string][] = [['today', 'Today'], ['week', 'Week'], ['records', 'Records'], ['phases', 'Phases']]

  return (
    <div className="flex flex-col mx-auto font-[family-name:var(--font-geist-sans)]"
      style={{ height: '100dvh', maxWidth: 480, backgroundColor: C.bg }}>

      {/* Site nav */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-zinc-100 flex-shrink-0">
        <Link href="/" className="font-mono text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
          ← randomorium.ai
        </Link>
        <a href="https://shop.randomorium.ai" target="_blank" rel="noopener noreferrer"
          className="text-xs bg-black text-white px-3 py-1.5 rounded-full hover:bg-zinc-800 transition-colors">
          buy a hat →
        </a>
      </div>

      {/* Tabs */}
      <div className="flex flex-shrink-0" style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}>
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex-1 py-3 text-xs font-semibold transition-colors"
            style={{
              color: tab === id ? C.strength : C.textDim,
              borderBottom: `2.5px solid ${tab === id ? C.strength : 'transparent'}`,
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {tab === 'today' && (
          <TodayTab sched={sched} config={config} bank={bank}
            allLogs={allLogs} setAllLogs={setAllLogs}
            pbs={pbs} setPbs={setPbs}
            painLogs={painLogs} setPainLogs={setPainLogs} />
        )}
        {tab === 'week' && (
          <WeekTab weekOffset={weekOffset} setWeekOffset={setWeekOffset}
            sched={sched} setSched={setSched}
            config={config} allLogs={allLogs} bank={bank} />
        )}
        {tab === 'records' && <RecordsTab pbs={pbs} painLogs={painLogs} allLogs={allLogs} bank={bank} />}
        {tab === 'phases' && <PhasesTab />}
      </div>
    </div>
  )
}
