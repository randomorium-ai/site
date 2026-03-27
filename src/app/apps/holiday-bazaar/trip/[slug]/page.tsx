import type { Metadata } from "next"
import TripView from "./TripView"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return {
    title: "Join the trip · Holiday Bazaar · randomorium",
    description: "You've been invited to plan a group holiday. Add your dates and let the flights decide.",
    openGraph: {
      title: "You're invited — Holiday Bazaar",
      description: "Add your availability and let the flights decide where the group goes.",
      url: `https://randomorium.ai/apps/holiday-bazaar/trip/${slug}`,
    },
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  return <TripView slug={slug} />
}
