import type { Metadata } from "next"
import SleepCalc from "./SleepCalc"

export const metadata: Metadata = {
  title: "Sleep Calculator · randomorium",
  description:
    "Find the best time to sleep or wake up based on 90-minute sleep cycles.",
}

export default function Page() {
  return <SleepCalc />
}
