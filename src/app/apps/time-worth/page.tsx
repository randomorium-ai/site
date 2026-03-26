import type { Metadata } from "next"
import TimeWorth from "./TimeWorth"

export const metadata: Metadata = {
  title: "Time Worth · randomorium",
  description:
    "See what you earn per second and convert any purchase into hours of your life.",
}

export default function Page() {
  return <TimeWorth />
}
