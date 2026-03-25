import type { Metadata } from "next"
import MeetingPrice from "./MeetingPrice"

export const metadata: Metadata = {
  title: "Meeting Price · randomorium",
  description:
    "Find out what your meetings actually cost — in real time. A real-time meeting cost calculator.",
}

export default function Page() {
  return <MeetingPrice />
}
