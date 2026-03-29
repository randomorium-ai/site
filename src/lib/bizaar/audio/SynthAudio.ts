// ── Bizaar Synth Audio ──
// Web Audio API SFX generator. Zero dependencies, zero audio files.
// AudioContext created lazily on first user interaction (mobile autoplay policy).

import { useAudioStore } from '../stores/audioStore'

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

function isMuted(): boolean {
  return useAudioStore.getState().muted
}

/** Short click/thud for placing a card */
export function cardPlace() {
  if (isMuted()) return
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(80, ac.currentTime)
  osc.frequency.exponentialRampToValueAtTime(40, ac.currentTime + 0.05)
  gain.gain.setValueAtTime(0.3, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08)
  osc.connect(gain).connect(ac.destination)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.08)
}

/** Opponent card place — slightly higher pitch */
export function opponentCardPlace() {
  if (isMuted()) return
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(120, ac.currentTime)
  osc.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.05)
  gain.gain.setValueAtTime(0.2, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.07)
  osc.connect(gain).connect(ac.destination)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.07)
}

/** Soft whoosh for drawing a card */
export function cardDraw() {
  if (isMuted()) return
  const ac = getCtx()
  const bufferSize = ac.sampleRate * 0.1
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
  }
  const source = ac.createBufferSource()
  source.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(2000, ac.currentTime)
  filter.frequency.exponentialRampToValueAtTime(500, ac.currentTime + 0.1)
  filter.Q.value = 1.5
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0.15, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1)
  source.connect(filter).connect(gain).connect(ac.destination)
  source.start(ac.currentTime)
}

/** Low tone for passing */
export function pass() {
  if (isMuted()) return
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(200, ac.currentTime)
  osc.frequency.exponentialRampToValueAtTime(150, ac.currentTime + 0.2)
  gain.gain.setValueAtTime(0.15, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25)
  osc.connect(gain).connect(ac.destination)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.25)
}

/** Ascending blip for score change */
export function scoreTick() {
  if (isMuted()) return
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(440, ac.currentTime)
  osc.frequency.exponentialRampToValueAtTime(880, ac.currentTime + 0.08)
  gain.gain.setValueAtTime(0.12, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1)
  osc.connect(gain).connect(ac.destination)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.1)
}

/** Rising chord for empire activation */
export function empireActivate() {
  if (isMuted()) return
  const ac = getCtx()
  const freqs = [300, 450, 600]
  freqs.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    const startTime = ac.currentTime + i * 0.06
    osc.frequency.setValueAtTime(freq, startTime)
    osc.frequency.exponentialRampToValueAtTime(freq * 1.2, startTime + 0.5)
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6)
    osc.connect(gain).connect(ac.destination)
    osc.start(startTime)
    osc.stop(startTime + 0.6)
  })
}

/** Harsh buzz for disruption card */
export function disruption() {
  if (isMuted()) return
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(100, ac.currentTime)
  gain.gain.setValueAtTime(0.1, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15)
  osc.connect(gain).connect(ac.destination)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.15)
}

/** Major chord arpeggio for round win */
export function roundWin() {
  if (isMuted()) return
  const ac = getCtx()
  const notes = [262, 330, 392] // C4-E4-G4
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    const t = ac.currentTime + i * 0.1
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.18, t + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
    osc.connect(gain).connect(ac.destination)
    osc.start(t)
    osc.stop(t + 0.35)
  })
}

/** Triumphant fanfare for match win */
export function matchWin() {
  if (isMuted()) return
  const ac = getCtx()
  const notes = [262, 330, 392, 523] // C4-E4-G4-C5
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    const t = ac.currentTime + i * 0.12
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.2, t + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6)
    osc.connect(gain).connect(ac.destination)
    osc.start(t)
    osc.stop(t + 0.6)
  })
}

/** Descending minor for match loss */
export function matchLose() {
  if (isMuted()) return
  const ac = getCtx()
  const notes = [440, 349, 294] // A4-F4-D4
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    const t = ac.currentTime + i * 0.15
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.18, t + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
    osc.connect(gain).connect(ac.destination)
    osc.start(t)
    osc.stop(t + 0.45)
  })
}
