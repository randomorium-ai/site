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
]
