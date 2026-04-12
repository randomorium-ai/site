import type { Metadata } from 'next'
import SixDegreesGame from './SixDegreesGame'

export const metadata: Metadata = {
  title: 'Six Degrees · Footballorium · randomorium',
  description: 'Connect two players through shared clubs in 6 transfers or fewer.',
}

interface Props { searchParams: Promise<{ date?: string }> }

export default async function SixDegreesPage({ searchParams }: Props) {
  const { date } = await searchParams
  return <SixDegreesGame date={date} />
}
