// ── Bizaar Generative Ambient Music ──
// Authentic Middle-Eastern bazaar atmosphere using Maqam Hijaz scale.
// Oud-like plucked strings, ambient drone, doumbek percussion, crowd murmur.
// Dynamic intensity based on scene and gameplay.

import { useAudioStore } from '../stores/audioStore'

export type MusicScene = 'menu' | 'battle' | 'result-win' | 'result-lose' | 'silent'

// ═══════════════════════════════════════
// MAQAM HIJAZ — authentic Middle Eastern scale
// Hijaz: D Eb F# G A Bb C D
// The augmented second (Eb→F#) gives the distinctive "bazaar" sound
// ═══════════════════════════════════════
const HIJAZ = {
  D2: 73.42, Eb2: 77.78, Fs2: 92.50, G2: 98.00, A2: 110.00, Bb2: 116.54, C3: 130.81,
  D3: 146.83, Eb3: 155.56, Fs3: 185.00, G3: 196.00, A3: 220.00, Bb3: 233.08, C4: 261.63,
  D4: 293.66, Eb4: 311.13, Fs4: 370.00, G4: 392.00, A4: 440.00, Bb4: 466.16, C5: 523.25,
  D5: 587.33,
}

// Melody subsets per mood
const MENU_NOTES = [HIJAZ.D3, HIJAZ.Eb3, HIJAZ.Fs3, HIJAZ.G3, HIJAZ.A3, HIJAZ.D4, HIJAZ.Eb4]
const BATTLE_NOTES = [HIJAZ.D3, HIJAZ.Fs3, HIJAZ.G3, HIJAZ.A3, HIJAZ.Bb3, HIJAZ.D4, HIJAZ.Fs4, HIJAZ.G4]
const WIN_NOTES = [HIJAZ.D4, HIJAZ.Fs4, HIJAZ.G4, HIJAZ.A4, HIJAZ.D5]
const LOSE_NOTES = [HIJAZ.D3, HIJAZ.Eb3, HIJAZ.G3, HIJAZ.Bb3, HIJAZ.D4, HIJAZ.Eb4]

class BazaarMusicEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private droneOsc1: OscillatorNode | null = null
  private droneOsc2: OscillatorNode | null = null
  private droneGain1: GainNode | null = null
  private droneGain2: GainNode | null = null
  private melodyTimer: ReturnType<typeof setTimeout> | null = null
  private percTimer: ReturnType<typeof setTimeout> | null = null
  private ambientTimer: ReturnType<typeof setTimeout> | null = null
  private ambientSource: AudioBufferSourceNode | null = null
  private ambientGain: GainNode | null = null
  private currentScene: MusicScene = 'silent'
  private running = false

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.22
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

    this.startDrone(scene)
    this.scheduleMelody(scene)
    if (scene === 'battle') {
      this.schedulePerc()
    }
    this.startAmbientBed()
  }

  stop() {
    this.running = false
    this.currentScene = 'silent'

    if (this.droneOsc1) { try { this.droneOsc1.stop() } catch {} this.droneOsc1 = null }
    if (this.droneOsc2) { try { this.droneOsc2.stop() } catch {} this.droneOsc2 = null }
    if (this.droneGain1) { this.droneGain1.disconnect(); this.droneGain1 = null }
    if (this.droneGain2) { this.droneGain2.disconnect(); this.droneGain2 = null }
    if (this.melodyTimer) { clearTimeout(this.melodyTimer); this.melodyTimer = null }
    if (this.percTimer) { clearTimeout(this.percTimer); this.percTimer = null }
    if (this.ambientTimer) { clearTimeout(this.ambientTimer); this.ambientTimer = null }
    if (this.ambientSource) { try { this.ambientSource.stop() } catch {} this.ambientSource = null }
    if (this.ambientGain) { this.ambientGain.disconnect(); this.ambientGain = null }
  }

  setScene(scene: MusicScene) {
    if (scene === this.currentScene) return
    this.start(scene)
  }

  // ── DRONE ──
  private startDrone(scene: MusicScene) {
    const ac = this.getCtx()
    if (!this.masterGain) return

    const vol = scene === 'menu' ? 0.1 : scene === 'battle' ? 0.07 : 0.05

    // Root drone — D2 with subtle LFO vibrato
    this.droneGain1 = ac.createGain()
    this.droneOsc1 = ac.createOscillator()
    this.droneOsc1.type = 'sine'
    this.droneOsc1.frequency.value = HIJAZ.D2
    this.droneGain1.gain.setValueAtTime(0, ac.currentTime)
    this.droneGain1.gain.linearRampToValueAtTime(vol, ac.currentTime + 3)

    // Add subtle vibrato via LFO
    const lfo = ac.createOscillator()
    const lfoGain = ac.createGain()
    lfo.type = 'sine'
    lfo.frequency.value = 0.3  // Very slow modulation
    lfoGain.gain.value = 1.5   // Slight pitch wobble
    lfo.connect(lfoGain).connect(this.droneOsc1.frequency)
    lfo.start()

    this.droneOsc1.connect(this.droneGain1).connect(this.masterGain)
    this.droneOsc1.start()

    // Fifth drone — A2 (perfect fifth)
    this.droneGain2 = ac.createGain()
    this.droneOsc2 = ac.createOscillator()
    this.droneOsc2.type = 'sine'
    this.droneOsc2.frequency.value = HIJAZ.A2
    this.droneGain2.gain.setValueAtTime(0, ac.currentTime)
    this.droneGain2.gain.linearRampToValueAtTime(vol * 0.4, ac.currentTime + 4)
    this.droneOsc2.connect(this.droneGain2).connect(this.masterGain)
    this.droneOsc2.start()
  }

  // ── OUD-LIKE PLUCK ──
  private playOudPluck(freq: number, vol: number) {
    const ac = this.getCtx()
    if (!this.masterGain) return

    // Karplus-Strong inspired pluck: initial noise burst → filtered decay
    const dur = 0.6 + Math.random() * 0.4

    // Excitation: short noise burst
    const noiseLen = ac.sampleRate * 0.015
    const noiseBuf = ac.createBuffer(1, noiseLen, ac.sampleRate)
    const noiseData = noiseBuf.getChannelData(0)
    for (let i = 0; i < noiseLen; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * (1 - i / noiseLen)
    }
    const noise = ac.createBufferSource()
    noise.buffer = noiseBuf
    const noiseGain = ac.createGain()
    noiseGain.gain.setValueAtTime(vol * 0.3, ac.currentTime)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.03)

    // Tonal body: triangle oscillator at note frequency
    const osc = ac.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const oscGain = ac.createGain()
    oscGain.gain.setValueAtTime(vol, ac.currentTime)
    oscGain.gain.setValueAtTime(vol * 0.8, ac.currentTime + 0.01) // Initial attack
    oscGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur)

    // String resonance filter
    const filter = ac.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = freq * 2
    filter.Q.value = 4

    // Second harmonic for richness
    const harm = ac.createOscillator()
    harm.type = 'sine'
    harm.frequency.value = freq * 2
    const harmGain = ac.createGain()
    harmGain.gain.setValueAtTime(vol * 0.15, ac.currentTime)
    harmGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur * 0.5)

    noise.connect(noiseGain).connect(this.masterGain)
    osc.connect(filter).connect(oscGain).connect(this.masterGain)
    harm.connect(harmGain).connect(this.masterGain)

    noise.start(ac.currentTime)
    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + dur)
    harm.start(ac.currentTime)
    harm.stop(ac.currentTime + dur * 0.5)
  }

  // ── MELODY ──
  private scheduleMelody(scene: MusicScene) {
    if (!this.running) return

    const interval = scene === 'menu'
      ? 2500 + Math.random() * 4000      // Sparse, mysterious
      : scene === 'battle'
        ? 700 + Math.random() * 1800       // Active
        : 1500 + Math.random() * 3000      // Result — moderate

    this.melodyTimer = setTimeout(() => {
      if (!this.running) return
      this.playMelodyPhrase(scene)
      this.scheduleMelody(scene)
    }, interval)
  }

  private playMelodyPhrase(scene: MusicScene) {
    if (useAudioStore.getState().muted) return

    const notes = scene === 'menu' ? MENU_NOTES
      : scene === 'result-win' ? WIN_NOTES
      : scene === 'result-lose' ? LOSE_NOTES
      : BATTLE_NOTES

    // Play 1-3 note phrases
    const phraseLen = 1 + Math.floor(Math.random() * 3)
    const vol = scene === 'battle' ? 0.06 : 0.04

    for (let i = 0; i < phraseLen; i++) {
      const freq = notes[Math.floor(Math.random() * notes.length)]
      setTimeout(() => {
        if (!this.running) return
        this.playOudPluck(freq, vol)
      }, i * (120 + Math.random() * 200))
    }
  }

  // ── DOUMBEK PERCUSSION ──
  private schedulePerc() {
    if (!this.running) return

    // 4-beat doumbek pattern: DUM-tek-tek-DUM (Middle Eastern rhythm)
    const beatInterval = 350 + Math.random() * 100 // ~130-170 BPM

    this.percTimer = setTimeout(() => {
      if (!this.running || this.currentScene !== 'battle') return
      this.playPercPattern()
      this.schedulePerc()
    }, beatInterval * 4) // Full pattern cycle
  }

  private playPercPattern() {
    if (useAudioStore.getState().muted) return
    const ac = this.getCtx()
    if (!this.masterGain) return

    const beatTime = 0.3

    // Pattern: DUM (low) - tek (high) - [rest] - tek (high)
    const pattern = [
      { time: 0, type: 'dum' as const },
      { time: beatTime, type: 'tek' as const },
      { time: beatTime * 3, type: 'tek' as const },
    ]

    // Sometimes add a fill
    if (Math.random() > 0.6) {
      pattern.push({ time: beatTime * 2.5, type: 'tek' as const })
    }

    pattern.forEach(({ time, type }) => {
      const bufSize = ac.sampleRate * (type === 'dum' ? 0.08 : 0.04)
      const buffer = ac.createBuffer(1, bufSize, ac.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, type === 'dum' ? 2 : 4)
      }

      const source = ac.createBufferSource()
      source.buffer = buffer

      const filter = ac.createBiquadFilter()
      filter.type = 'bandpass'
      if (type === 'dum') {
        filter.frequency.value = 150 + Math.random() * 50
        filter.Q.value = 4
      } else {
        filter.frequency.value = 1200 + Math.random() * 400
        filter.Q.value = 8
      }

      const gain = ac.createGain()
      const t = ac.currentTime + time
      const vol = type === 'dum' ? 0.05 : 0.02
      gain.gain.setValueAtTime(vol, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + (type === 'dum' ? 0.1 : 0.04))

      source.connect(filter).connect(gain).connect(this.masterGain!)
      source.start(t)
    })
  }

  // ── AMBIENT BED — distant crowd, wind ──
  private startAmbientBed() {
    if (!this.running) return
    const ac = this.getCtx()
    if (!this.masterGain) return

    // Looping filtered noise for ambient wind/crowd murmur
    const duration = 4
    const bufSize = ac.sampleRate * duration
    const buffer = ac.createBuffer(1, bufSize, ac.sampleRate)
    const data = buffer.getChannelData(0)

    // Generate noise with slow amplitude modulation (crowd-like)
    for (let i = 0; i < bufSize; i++) {
      const t = i / ac.sampleRate
      const modulation = 0.5 + 0.5 * Math.sin(t * 0.8) * Math.sin(t * 1.3)
      data[i] = (Math.random() * 2 - 1) * modulation * 0.3
    }

    this.ambientSource = ac.createBufferSource()
    this.ambientSource.buffer = buffer
    this.ambientSource.loop = true

    // Multiple filters to shape the crowd murmur
    const lowpass = ac.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 400
    lowpass.Q.value = 0.5

    const highpass = ac.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = 60

    this.ambientGain = ac.createGain()
    const vol = this.currentScene === 'battle' ? 0.03 : 0.02
    this.ambientGain.gain.setValueAtTime(0, ac.currentTime)
    this.ambientGain.gain.linearRampToValueAtTime(vol, ac.currentTime + 5)

    this.ambientSource.connect(highpass).connect(lowpass).connect(this.ambientGain).connect(this.masterGain)
    this.ambientSource.start()

    // Occasional wind gusts
    this.scheduleWindGust()
  }

  private scheduleWindGust() {
    if (!this.running) return

    this.ambientTimer = setTimeout(() => {
      if (!this.running) return
      this.playWindGust()
      this.scheduleWindGust()
    }, 5000 + Math.random() * 8000)
  }

  private playWindGust() {
    if (useAudioStore.getState().muted) return
    const ac = this.getCtx()
    if (!this.masterGain) return

    const dur = 1 + Math.random() * 1.5
    const bufSize = ac.sampleRate * dur
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
    filter.frequency.setValueAtTime(300, ac.currentTime)
    filter.frequency.exponentialRampToValueAtTime(800, ac.currentTime + dur * 0.4)
    filter.frequency.exponentialRampToValueAtTime(200, ac.currentTime + dur)
    filter.Q.value = 1.5

    const gain = ac.createGain()
    gain.gain.setValueAtTime(0, ac.currentTime)
    gain.gain.linearRampToValueAtTime(0.015, ac.currentTime + dur * 0.3)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur)

    source.connect(filter).connect(gain).connect(this.masterGain)
    source.start(ac.currentTime)
  }
}

// Singleton
export const bazaarMusic = new BazaarMusicEngine()
