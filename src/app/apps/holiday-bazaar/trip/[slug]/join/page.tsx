import type { Metadata } from "next"
import JoinView from "./JoinView"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return {
    title: "Join the trip · Holiday Bazaar · randomorium",
    description: "Add your dates and let the flights decide where the group goes.",
    openGraph: {
      title: "You're invited — Holiday Bazaar",
      description: "Add your availability and let the flights decide where the group goes.",
      url: `https://randomorium.ai/apps/holiday-bazaar/trip/${slug}/join`,
    },
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  return <JoinView slug={slug} />
}
