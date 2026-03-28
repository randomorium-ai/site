import type { Metadata } from 'next'
import TheNumberGame from './TheNumberGame'

export const metadata: Metadata = {
  title: 'The Number · Football Games · randomorium',
  description: 'Pick 3 players whose stat totals a daily target. No hints — just memory.',
}

export default function TheNumberPage() {
  return <TheNumberGame />
}
