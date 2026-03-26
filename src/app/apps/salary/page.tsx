import type { Metadata } from "next"
import SalaryNegotiator from "./SalaryNegotiator"

export const metadata: Metadata = {
  title: "Salary Negotiator · randomorium",
  description:
    "Paste your offer. Get an instant negotiation score and an AI-generated playbook with counter-offer, email, and verbal script.",
}

export default function Page() {
  return <SalaryNegotiator />
}
