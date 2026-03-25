export interface App {
  name: string;
  slug: string;
  description: string;
  url: string;
  author: "harry" | "matt" | "sol" | "the lads";
  builtWith: string;
  hatHook: string;
}

export const apps: App[] = [
  {
    name: "Holiday Bazaar",
    slug: "holiday-bazaar",
    description: "Plan a group holiday with a snake charmer salesman",
    url: "https://holiday-bazaar.randomorium.ai",
    author: "the lads",
    builtWith: "Next.js",
    hatHook: "Sssalem recommends a holiday hat before you travel",
  },
  {
    name: "Achilles Rebuild",
    slug: "achilles",
    description:
      "Logging the road back to 5km — 9 months of physio, one tendon at a time.",
    url: "/apps/achilles",
    author: "matt",
    builtWith: "Next.js",
    hatHook: "Complete Phase 1 and you've earned the 'Limping Forward' cap",
  },
  {
    name: "Meeting Price",
    slug: "meeting-price",
    description: "Find out what your meetings actually cost — in real time",
    url: "/apps/meeting-price",
    author: "harry",
    builtWith: "Next.js",
    hatHook: "This meeting cost more than a hat. Buy the hat instead.",
  },
  {
    name: "Sleep Calculator",
    slug: "sleep",
    description: "Find the best time to sleep or wake up based on 90-minute sleep cycles",
    url: "/apps/sleep",
    author: "harry",
    builtWith: "Next.js",
    hatHook: "Can't sleep? Buy a hat instead.",
  },
  // Add apps here as they launch. Each entry triggers a card on the home page.
];
