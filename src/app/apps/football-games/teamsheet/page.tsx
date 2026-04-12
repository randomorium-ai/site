import type { Metadata } from 'next'
import TeamsheetGame from './TeamsheetGame'

export const metadata: Metadata = {
  title: 'Teamsheet · Footballorium · randomorium',
  description: 'Name every player in a famous match formation.',
}

interface Props { searchParams: Promise<{ date?: string }> }

export default async function TeamsheetPage({ searchParams }: Props) {
  const { date } = await searchParams
  return <TeamsheetGame date={date} />
}
