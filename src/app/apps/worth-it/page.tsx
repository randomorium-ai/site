import type { Metadata } from "next"
import WorthIt from "./WorthIt"

export const metadata: Metadata = {
  title: "Worth It? · randomorium",
  description:
    "See what your small daily expenses actually cost you over time. A recurring cost reality check.",
}

export default function Page() {
  return <WorthIt />
}
