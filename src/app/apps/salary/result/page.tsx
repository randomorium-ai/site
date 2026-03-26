import type { Metadata } from "next"
import SalaryResult from "./SalaryResult"

export const metadata: Metadata = {
  title: "Your Negotiation Playbook · randomorium",
  description:
    "Your personalised salary negotiation score and AI-generated playbook.",
}

export default function Page() {
  return <SalaryResult />
}
