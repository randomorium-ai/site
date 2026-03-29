// ── Bizaar Generative Ambient Music ──
// Web Audio API generative music. Middle-eastern bazaar atmosphere.
// Phrygian scale drone + plucked strings + subtle percussion.
// Three scenes: menu (mysterious), battle (tense), result (varied).

import { useAudioStore } from '../stores/audioStore'

export type MusicScene = 'menu' | 'battle' | 'result-win' | 'result-lose' | 'silent'

// Phrygian scale on D — dark, Middle Eastern
const PHRYGIAN_D = [
  146.83, // D3
  155.56, // Eb3
  174.61, // F3
  196.00, // G3
  207.65, // Ab3
  233.08, // Bb3
  261.63, // C4
  293.66, // D4
  311.13, // Eb4
  349.23, // F4
  392.00, // G4
]

// Pentatonic subset for melodies (less dissonant)
const MELODY_NOTES = [
  146.83, // D3
  174.61, // F3
  196.00, // G3
  233.08, // Bb3
  293.66, // D4
  349.23, // F4
  392.00, // G4
]

class BazaarMusicEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private droneOsc: OscillatorNode | null = null
  private droneGain: GainNode | null = null
  private drone2Osc: OscillatorNode | null = null
  private drone2Gain: GainNode | null = null
  private melodyTimer: ReturnType<typeof setTimeout> | null = null
  private percTimer: ReturnType<typeof setTimeout> | null = null
  private currentScene: MusicScene = 'silent'
  private running = false

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.25
      this.masterGain.connect(this.ctx.destination)
    }
    return this.ctx
  }

  start(scene: MusicScene) {
    if (useAudioStore.getState().muted) return
    if (scene === 'silent') { this.stop(); return }
    if (this.currentScene === scene && this.running) return

    this.stop()
    this.currentScene = scene
    this.running = true

    const ac = this.getCtx()
    if (ac.state === 'suspended') ac.resume()

    // Start drone
    this.startDrone(scene)
    // Start melody loop
    this.scheduleMelody(scene)
    // Start percussion (battle only)
    if (scene === 'battle') this.schedulePerc()
  }

  stop() {
    this.running = false
    this.currentScene = 'silent'

    if (this.droneOsc) { try { this.droneOsc.stop() } catch {} this.droneOsc = null }
    if (this.drone2Osc) { try { this.drone2Osc.stop() } catch {} this.drone2Osc = null }
    if (this.droneGain) { this.droneGain.disconnect(); this.droneGain = null }
    if (this.drone2Gain) { this.drone2Gain.disconnect(); this.drone2Gain = null }
    if (this.melodyTimer) { clearTimeout(this.melodyTimer); this.melodyTimer = null }
    if (this.percTimer) { clearTimeout(this.percTimer); this.percTimer = null }
  }

  setScene(scene: MusicScene) {
    if (scene === this.currentScene) return
    this.start(scene)
  }

  private startDrone(scene: MusicScene) {
    const ac = this.getCtx()
    if (!this.masterGain) return

    // Root drone — D2
    this.droneGain = ac.createGain()
    this.droneOsc = ac.createOscillator()
    this.droneOsc.type = 'sine'
    this.droneOsc.frequency.value = 73.42 // D2

    const droneVol = scene === 'menu' ? 0.12 : scene === 'battle' ? 0.08 : 0.06
    this.droneGain.gain.setValueAtTime(0, ac.currentTime)
    this.droneGain.gain.linearRampToValueAtTime(droneVol, ac.currentTime + 2)
    this.droneOsc.connect(this.droneGain).connect(this.masterGain)
    this.droneOsc.start()

    // Fifth drone — A2 (adds depth)
    this.drone2Gain = ac.createGain()
    this.drone2Osc = ac.createOscillator()
    this.drone2Osc.type = 'sine'
    this.drone2Osc.frequency.value = 110 // A2

    const drone2Vol = droneVol * 0.5
    this.drone2Gain.gain.setValueAtTime(0, ac.currentTime)
    this.drone2Gain.gain.linearRampToValueAtTime(drone2Vol, ac.currentTime + 3)
    this.drone2Osc.connect(this.drone2Gain).connect(this.masterGain)
    this.drone2Osc.start()
  }

  private scheduleMelody(scene: MusicScene) {
    if (!this.running) return

    const interval = scene === 'menu'
      ? 2000 + Math.random() * 4000      // Sparse, mysterious
      : scene === 'battle'
        ? 800 + Math.random() * 2000       // More frequent
        : 1500 + Math.random() * 3000      // Result — moderate

    this.melodyTimer = setTimeout(() => {
      if (!this.running) return
      this.playMelodyNote(scene)
      this.scheduleMelody(scene)
    }, interval)
  }

  private playMelodyNote(scene: MusicScene) {
    if (useAudioStore.getState().muted) return
    const ac = this.getCtx()
    if (!this.masterGain) return

    const notes = scene === 'menu' ? PHRYGIAN_D : MELODY_NOTES
    const freq = notes[Math.floor(Math.random() * notes.length)]

    const osc = ac.createOscillator()
    const gain = ac.createGain()
    const filter = ac.createBiquadFilter()

    osc.type = 'triangle'
    osc.frequency.value = freq

    filter.type = 'lowpass'
    filter.frequency.value = 1200
    filter.Q.value = 2

    const vol = scene === 'battle' ? 0.06 : 0.04
    const decay = 0.4 + Math.random() * 0.6

    gain.gain.setValueAtTime(vol, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + decay)

    osc.connect(filter).connect(gain).connect(this.masterGain)
    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + decay)

    // Occasionally play a second note for harmony (thirds/fifths)
    if (Math.random() > 0.6) {
      const idx = notes.indexOf(freq)
      const harmIdx = Math.min(idx + 2, notes.length - 1)
      const harmFreq = notes[harmIdx]

      const osc2 = ac.createOscillator()
      const gain2 = ac.createGain()
      osc2.type = 'triangle'
      osc2.frequency.value = harmFreq
      gain2.gain.setValueAtTime(vol * 0.5, ac.currentTime + 0.05)
      gain2.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + decay * 0.8)
      osc2.connect(filter).connect(gain2).connect(this.masterGain)
      osc2.start(ac.currentTime + 0.05)
      osc2.stop(ac.currentTime + decay * 0.8)
    }
  }

  private schedulePerc() {
    if (!this.running) return

    const interval = 400 + Math.random() * 300  // ~120-150 BPM feel

    this.percTimer = setTimeout(() => {
      if (!this.running) return
      if (Math.random() > 0.4) this.playPerc()  // Not every beat
      this.schedulePerc()
    }, interval)
  }

  private playPerc() {
    if (useAudioStore.getState().muted) return
    const ac = this.getCtx()
    if (!this.masterGain) return

    // Filtered noise burst — tabla-like
    const bufferSize = ac.sampleRate * 0.06
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }

    const source = ac.createBufferSource()
    source.buffer = buffer

    const filter = ac.createBiquadFilter()
    filter.type = 'bandpass'
    const isLow = Math.random() > 0.5
    filter.frequency.value = isLow ? 200 : 800
    filter.Q.value = isLow ? 3 : 5

    const gain = ac.createGain()
    gain.gain.setValueAtTime(isLow ? 0.06 : 0.03, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08)

    source.connect(filter).connect(gain).connect(this.masterGain)
    source.start(ac.currentTime)
  }
}

// Singleton
export const bazaarMusic = new BazaarMusicEngine()
