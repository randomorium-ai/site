// ── Bizaar Synth Audio ──
// Web Audio API SFX generator. Zero dependencies, zero audio files.
// AudioContext created lazily on first user interaction (mobile autoplay policy).

import { useAudioStore } from '../stores/audioStore'

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function isMuted(): boolean {
  return useAudioStore.getState().muted
}

// ════════════════════════════════════════
// CARD INTERACTIONS
// ════════════════════════════════════════

/** Short click/thud for placing a card */
export function cardPlace() {
  if (isMuted()) return
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(80, ac.currentTime)
  osc.frequency.exponentialRampToValueAtTime(40, ac.currentTime + 0.06)
  gain.gain.setValueAtTime(0.35, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1)
  osc.connect(gain).connect(ac.destination)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.1)

  // Add a click layer
  const click = ac.createOscillator()
  const clickGain = ac.createGain()
  click.type = 'square'
  click.frequency.setValueAtTime(800, ac.currentTime)
  click.frequency.exponentialRampToValueAtTime(200, ac.currentTime + 0.02)
  clickGain.gain.setValueAtTime(0.05, ac.currentTime)
  clickGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.03)
  click.connect(clickGain).connect(ac.destination)
  click.start(ac.currentTime)
  click.stop(ac.currentTime + 0.03)
}

/** Opponent card place — slightly higher pitch, different character */
export function opponentCardPlace() {
  if (isMuted()) return
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(120, ac.currentTime)
  osc.frequency.exponentialRampToValueAtTime(50, ac.currentTime + 0.06)
  gain.gain.setValueAtTime(0.25, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08)
  osc.connect(gain).connect(ac.destination)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.08)
}

/** Card select — bright tick */
export function cardSelect() {
  if (isMuted()) return
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(600, ac.currentTime)
  osc.frequency.setValueAtTime(800, ac.currentTime + 0.02)
  gain.gain.setValueAtTime(0.1, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06)
  osc.connect(gain).connect(ac.destination)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.06)
}

/** Card deselect — softer descending tick */
export function cardDeselect() {
  if (isMuted()) return
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(600, ac.currentTime)
  osc.frequency.exponentialRampToValueAtTime(400, ac.currentTime + 0.04)
  gain.gain.setValueAtTime(0.07, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05)
  osc.connect(gain).connect(ac.destination)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.05)
}

/** Soft whoosh for drawing a card */
export function cardDraw() {
  if (isMuted()) return
  const ac = getCtx()
  const bufferSize = ac.sampleRate * 0.12
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
  filter.frequency.exponentialRampToValueAtTime(500, ac.currentTime + 0.12)
  filter.Q.value = 1.5
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0.12, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12)
  source.connect(filter).connect(gain).connect(ac.destination)
  source.start(ac.currentTime)
}

// ════════════════════════════════════════
// TURN & ROUND
// ════════════════════════════════════════

/** Low tone for passing */
export function pass() {
  if (isMuted()) return
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(200, ac.currentTime)
  osc.frequency.exponentialRampToValueAtTime(130, ac.currentTime + 0.3)
  gain.gain.setValueAtTime(0.15, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35)
  osc.connect(gain).connect(ac.destination)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.35)
}

/** Turn start chime — gentle bell */
export function turnStart() {
  if (isMuted()) return
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(523, ac.currentTime) // C5
  gain.gain.setValueAtTime(0.08, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3)
  osc.connect(gain).connect(ac.destination)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.3)

  // Harmonic
  const osc2 = ac.createOscillator()
  const gain2 = ac.createGain()
  osc2.type = 'sine'
  osc2.frequency.value = 783.99 // G5
  gain2.gain.setValueAtTime(0.04, ac.currentTime + 0.05)
  gain2.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25)
  osc2.connect(gain2).connect(ac.destination)
  osc2.start(ac.currentTime + 0.05)
  osc2.stop(ac.currentTime + 0.25)
}

/** Round start fanfare — ascending tones */
export function roundStart() {
  if (isMuted()) return
  const ac = getCtx()
  const notes = [196, 261.63, 329.63] // G3-C4-E4
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'triangle'
    const t = ac.currentTime + i * 0.12
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.12, t + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
    osc.connect(gain).connect(ac.destination)
    osc.start(t)
    osc.stop(t + 0.4)
  })
}

/** Deck shuffle — rapid filtered noise */
export function shuffle() {
  if (isMuted()) return
  const ac = getCtx()
  for (let i = 0; i < 6; i++) {
    const bufSize = ac.sampleRate * 0.04
    const buffer = ac.createBuffer(1, bufSize, ac.sampleRate)
    const data = buffer.getChannelData(0)
    for (let j = 0; j < bufSize; j++) {
      data[j] = (Math.random() * 2 - 1) * (1 - j / bufSize)
    }
    const source = ac.createBufferSource()
    source.buffer = buffer
    const filter = ac.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 2000 + i * 500
    const gain = ac.createGain()
    const t = ac.currentTime + i * 0.05
    gain.gain.setValueAtTime(0.06, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04)
    source.connect(filter).connect(gain).connect(ac.destination)
    source.start(t)
  }
}

// ════════════════════════════════════════
// ABILITIES & EFFECTS
// ════════════════════════════════════════

/** Ascending blip for score change */
export function scoreTick() {
  if (isMuted()) return
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(440, ac.currentTime)
  osc.frequency.exponentialRampToValueAtTime(880, ac.currentTime + 0.08)
  gain.gain.setValueAtTime(0.1, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1)
  osc.connect(gain).connect(ac.destination)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.1)
}

/** Buff activation — warm rising tone */
export function buffActivate() {
  if (isMuted()) return
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(330, ac.currentTime)
  osc.frequency.exponentialRampToValueAtTime(660, ac.currentTime + 0.15)
  gain.gain.setValueAtTime(0.08, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2)
  osc.connect(gain).connect(ac.destination)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.2)
}

/** Strength decrease — descending tone */
export function debuff() {
  if (isMuted()) return
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(500, ac.currentTime)
  osc.frequency.exponentialRampToValueAtTime(200, ac.currentTime + 0.15)
  gain.gain.setValueAtTime(0.08, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2)
  osc.connect(gain).connect(ac.destination)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.2)
}

/** Rising Hijaz chord for empire activation — dramatic ascending */
export function empireActivate() {
  if (isMuted()) return
  const ac = getCtx()
  // D-F#-A-D (Hijaz major chord, bright and triumphant)
  const freqs = [146.83, 185.00, 220.00, 293.66, 370.00]
  freqs.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = i < 2 ? 'triangle' : 'sine'
    const startTime = ac.currentTime + i * 0.1
    osc.frequency.setValueAtTime(freq, startTime)
    osc.frequency.exponentialRampToValueAtTime(freq * 1.05, startTime + 0.8)
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(0.12, startTime + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1)
    osc.connect(gain).connect(ac.destination)
    osc.start(startTime)
    osc.stop(startTime + 1)
  })

  // Add shimmer — high filtered noise
  const bufSize = ac.sampleRate * 0.8
  const buffer = ac.createBuffer(1, bufSize, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2)
  }
  const source = ac.createBufferSource()
  source.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 4000
  filter.Q.value = 2
  const shimGain = ac.createGain()
  shimGain.gain.setValueAtTime(0.03, ac.currentTime + 0.2)
  shimGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.8)
  source.connect(filter).connect(shimGain).connect(ac.destination)
  source.start(ac.currentTime + 0.2)
}

/** Harsh buzz for disruption card */
export function disruption() {
  if (isMuted()) return
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(100, ac.currentTime)
  osc.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.12)
  gain.gain.setValueAtTime(0.08, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18)
  osc.connect(gain).connect(ac.destination)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.18)
}

// ════════════════════════════════════════
// ROUND & MATCH RESULTS
// ════════════════════════════════════════

/** Hijaz ascending arpeggio for round win */
export function roundWin() {
  if (isMuted()) return
  const ac = getCtx()
  // D-F#-A-D5 (Hijaz bright arpeggio)
  const notes = [293.66, 370.00, 440.00, 587.33]
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'triangle'
    const t = ac.currentTime + i * 0.1
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.15, t + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
    osc.connect(gain).connect(ac.destination)
    osc.start(t)
    osc.stop(t + 0.5)
  })
}

/** Hijaz descending for round loss — Eb-D-Bb-G */
export function roundLose() {
  if (isMuted()) return
  const ac = getCtx()
  const notes = [311.13, 293.66, 233.08, 196.00] // Eb4-D4-Bb3-G3
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    const t = ac.currentTime + i * 0.18
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.12, t + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
    osc.connect(gain).connect(ac.destination)
    osc.start(t)
    osc.stop(t + 0.4)
  })
}

/** Triumphant Hijaz fanfare for match win */
export function matchWin() {
  if (isMuted()) return
  const ac = getCtx()
  // D-F#-A-D5-F#5 (triumphant Hijaz arpeggio)
  const notes = [293.66, 370.00, 440.00, 587.33, 740.00]
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'triangle'
    const t = ac.currentTime + i * 0.14
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.18, t + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9)
    osc.connect(gain).connect(ac.destination)
    osc.start(t)
    osc.stop(t + 0.9)
  })
  // Sustained D major chord
  setTimeout(() => {
    if (isMuted()) return
    const chord = [293.66, 370.00, 440.00] // D-F#-A
    chord.forEach(freq => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.08, ac.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 2)
      osc.connect(gain).connect(ac.destination)
      osc.start(ac.currentTime)
      osc.stop(ac.currentTime + 2)
    })
  }, 700)
}

/** Hijaz descending for match loss — Eb-D-Bb-G-D3 */
export function matchLose() {
  if (isMuted()) return
  const ac = getCtx()
  const notes = [311.13, 293.66, 233.08, 196.00, 146.83] // Eb4-D4-Bb3-G3-D3
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    const t = ac.currentTime + i * 0.22
    osc.frequency.setValueAtTime(freq, t)
    // Add gentle pitch drop on each note
    osc.frequency.exponentialRampToValueAtTime(freq * 0.97, t + 0.5)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.13, t + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6)
    osc.connect(gain).connect(ac.destination)
    osc.start(t)
    osc.stop(t + 0.6)
  })
}

// ════════════════════════════════════════
// UI SOUNDS
// ════════════════════════════════════════

/** UI button click — clean pop */
export function uiClick() {
  if (isMuted()) return
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(1200, ac.currentTime)
  osc.frequency.exponentialRampToValueAtTime(600, ac.currentTime + 0.02)
  gain.gain.setValueAtTime(0.06, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.04)
  osc.connect(gain).connect(ac.destination)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.04)
}

/** UI hover — subtle tick */
export function uiHover() {
  if (isMuted()) return
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.value = 900
  gain.gain.setValueAtTime(0.02, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.02)
  osc.connect(gain).connect(ac.destination)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.02)
}

/** Match start — dramatic whoosh + chord */
export function matchStart() {
  if (isMuted()) return
  const ac = getCtx()

  // Whoosh
  const bufSize = ac.sampleRate * 0.3
  const buffer = ac.createBuffer(1, bufSize, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufSize; i++) {
    const env = Math.sin((i / bufSize) * Math.PI)
    data[i] = (Math.random() * 2 - 1) * env
  }
  const source = ac.createBufferSource()
  source.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(200, ac.currentTime)
  filter.frequency.exponentialRampToValueAtTime(1500, ac.currentTime + 0.15)
  filter.frequency.exponentialRampToValueAtTime(300, ac.currentTime + 0.3)
  filter.Q.value = 2
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0.1, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3)
  source.connect(filter).connect(gain).connect(ac.destination)
  source.start(ac.currentTime)

  // Opening chord
  const chord = [146.83, 220, 293.66] // D3-A3-D4
  chord.forEach((freq) => {
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const t = ac.currentTime + 0.15
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.1, t + 0.05)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8)
    osc.connect(g).connect(ac.destination)
    osc.start(t)
    osc.stop(t + 0.8)
  })
}
