import type { Metadata } from "next"
import HolidayBazaar from "./HolidayBazaar"

export const metadata: Metadata = {
  title: "Holiday Bazaar · randomorium",
  description: "Plan a group holiday. Find dates that work. Let the flights decide where you go.",
  openGraph: {
    title: "Holiday Bazaar",
    description: "Plan a group holiday. Find dates that work. Let the flights decide where you go.",
    url: "https://randomorium.ai/apps/holiday-bazaar",
  },
}

export default function Page() {
  return <HolidayBazaar />
}
