// ── Shared AudioContext ──
// Single AudioContext + master GainNode shared by SynthAudio and BazaarMusic.
// Avoids creating multiple AudioContexts (browser limit) and enables master volume control.

import { useAudioStore } from '../stores/audioStore'

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null

export function getSharedCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
    masterGain = ctx.createGain()
    masterGain.gain.value = useAudioStore.getState().volume
    masterGain.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function getSharedMasterGain(): GainNode {
  getSharedCtx() // ensure initialized
  return masterGain!
}

export function setMasterVolume(volume: number) {
  if (masterGain) {
    masterGain.gain.setValueAtTime(volume, masterGain.context.currentTime)
  }
}
