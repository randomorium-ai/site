import type { Metadata } from "next"
import FlightsView from "./FlightsView"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ window_start?: string; window_end?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return {
    title: "Flight options · Holiday Bazaar · randomorium",
    description: "Find the best flights for your group. Sorted by total cost and AL efficiency.",
    openGraph: {
      title: "Group flights — Holiday Bazaar",
      description: "Find the best flights for your group.",
      url: `https://randomorium.ai/apps/holiday-bazaar/trip/${slug}/flights`,
    },
  }
}

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params
  const { window_start, window_end } = await searchParams
  return <FlightsView slug={slug} windowStart={window_start ?? ""} windowEnd={window_end ?? ""} />
}
