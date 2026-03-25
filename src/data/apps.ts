export interface App {
  name: string
  slug: string
  description: string
  url: string
  author: "harry" | "matt" | "sol"
  builtWith: string
  hatHook: string
}

export const apps: App[] = [
  {
    name: "Holiday Bazaar",
    slug: "holiday-bazaar",
    description: "Plan a group holiday with a snake charmer salesman",
    url: "https://holiday-bazaar.randomorium.ai",
    author: "harry",
    builtWith: "Next.js",
    hatHook: "Sssalem recommends a holiday hat before you travel",
  },
  {
    name: "Achilles Rebuild",
    slug: "achilles",
    description: "Logging the road back to 5km — 9 months of physio, one tendon at a time.",
    url: "/apps/achilles",
    author: "matt",
    builtWith: "Next.js",
    hatHook: "Complete Phase 1 and you've earned the 'Limping Forward' cap",
  },
  // Add apps here as they launch. Each entry triggers a card on the home page.
]
