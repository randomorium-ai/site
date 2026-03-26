import type { Metadata } from "next"
import HalfLife from "./HalfLife"

export const metadata: Metadata = {
  title: "Half-Life · randomorium",
  description:
    "Track your caffeine levels in real time. See when it's safe to sleep based on actual half-life decay science.",
}

export default function Page() {
  return <HalfLife />
}
