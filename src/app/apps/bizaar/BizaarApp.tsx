'use client'

import { useState } from 'react'
import HatBanner from '@/components/HatBanner'
import MainMenu from './components/screens/MainMenu'
import BattleScreen from './components/screens/BattleScreen'
import ResultScreen from './components/screens/ResultScreen'

export type Screen = 'menu' | 'battle' | 'result'

export default function BizaarApp() {
  const [screen, setScreen] = useState<Screen>('menu')

  return (
    <>
      {screen === 'menu' && <MainMenu onStart={() => setScreen('battle')} />}
      {screen === 'battle' && (
        <BattleScreen onMatchEnd={() => setScreen('result')} />
      )}
      {screen === 'result' && (
        <ResultScreen
          onPlayAgain={() => setScreen('battle')}
          onMenu={() => setScreen('menu')}
        />
      )}
      {screen !== 'battle' && <HatBanner />}
    </>
  )
}
