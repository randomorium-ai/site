import type { Metadata } from "next"
import SalaryNegotiator from "./SalaryNegotiator"

export const metadata: Metadata = {
  title: "Sssalem's Scales \u00b7 The Salary Souk",
  description:
    "Paste your offer. Let Sssalem consult the scales and build your negotiation playbook \u2014 counter-offer, email, verbal script, and fallback plan.",
}

export default function Page() {
  return <SalaryNegotiator />
}
