'use client'

import { useState, useEffect } from 'react'
import HatBanner from '@/components/HatBanner'
import { bazaarMusic } from '@/lib/bizaar/audio/BazaarMusic'
import { useAudioStore } from '@/lib/bizaar/stores/audioStore'
import * as sfx from '@/lib/bizaar/audio/SynthAudio'
import { getMatchWinner } from '@/lib/bizaar/stores/gameStore'
import MainMenu from './components/screens/MainMenu'
import BattleScreen from './components/screens/BattleScreen'
import ResultScreen from './components/screens/ResultScreen'

export type Screen = 'menu' | 'battle' | 'result'

export default function BizaarApp() {
  const [screen, setScreen] = useState<Screen>('menu')
  const muted = useAudioStore(s => s.muted)

  // Music lifecycle per screen
  useEffect(() => {
    if (muted) { bazaarMusic.stop(); return }

    if (screen === 'menu') {
      bazaarMusic.start('menu')
    } else if (screen === 'result') {
      const winner = getMatchWinner()
      bazaarMusic.start(winner === 'player' ? 'result-win' : 'result-lose')
    }
    // Battle screen manages its own music
  }, [screen, muted])

  const handleStart = () => {
    sfx.uiClick()
    setScreen('battle')
  }

  const handleMatchEnd = () => {
    setScreen('result')
  }

  const handlePlayAgain = () => {
    sfx.uiClick()
    setScreen('battle')
  }

  const handleMenu = () => {
    sfx.uiClick()
    setScreen('menu')
  }

  return (
    <>
      {screen === 'menu' && <MainMenu onStart={handleStart} />}
      {screen === 'battle' && (
        <BattleScreen onMatchEnd={handleMatchEnd} />
      )}
      {screen === 'result' && (
        <ResultScreen
          onPlayAgain={handlePlayAgain}
          onMenu={handleMenu}
        />
      )}
      {screen !== 'battle' && <HatBanner />}
    </>
  )
}
