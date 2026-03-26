import type { Metadata } from "next"
import HangoverHelper from "./HangoverHelper"

export const metadata: Metadata = {
  title: "Hangover Helper · randomorium",
  description:
    "Diagnose your suffering. Get a real, hour-by-hour recovery plan.",
}

export default function Page() {
  return <HangoverHelper />
}
