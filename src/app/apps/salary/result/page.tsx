import type { Metadata } from "next"
import SalaryResult from "./SalaryResult"

export const metadata: Metadata = {
  title: "Sssalem's Verdict \u00b7 The Salary Souk",
  description:
    "Your personalised negotiation score and AI-generated playbook from Sssalem's Scales.",
}

export default function Page() {
  return <SalaryResult />
}
