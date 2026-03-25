import type { Metadata } from "next"
import SplitTheBill from "./SplitTheBill"

export const metadata: Metadata = {
  title: "Split the Bill · randomorium",
  description:
    "Split restaurant bills fairly — with items, tax, tip, and no arguments.",
}

export default function Page() {
  return <SplitTheBill />
}
