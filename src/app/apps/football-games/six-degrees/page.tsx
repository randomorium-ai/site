import type { Metadata } from 'next'
import SixDegreesGame from './SixDegreesGame'

export const metadata: Metadata = {
  title: 'Six Degrees · Footballorium · randomorium',
  description: 'Connect two players through shared clubs in 6 transfers or fewer.',
}

export default function SixDegreesPage() {
  return <SixDegreesGame />
}
