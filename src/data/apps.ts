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
    url: "/apps/holiday-bazaar",
    author: "the lads",
    builtWith: "Next.js",
    hatHook: "Sssalem recommends a holiday hat before you travel",
  },
  {
    name: "Football Games",
    slug: "football-games",
    description: "Daily football puzzles. Pick 3 players whose stats hit a target number. Five games coming.",
    url: "/apps/football-games",
    author: "matt",
    builtWith: "Next.js",
    hatHook: "Win The Number and you've earned the 'Educated Guess' cap",
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
    name: "Hangover Helper",
    slug: "hangover",
    description: "Diagnose your suffering. Get a real recovery plan.",
    url: "/apps/hangover",
    author: "harry",
    builtWith: "Next.js",
    hatHook: "Every hangover ends at the hat shop.",
  },
  {
    name: "Salary Negotiator",
    slug: "salary",
    description:
      "Paste your offer. Get a negotiation score and an AI-generated playbook — counter-offer, email, verbal script, fallback plan.",
    url: "/apps/salary",
    author: "harry",
    builtWith: "Next.js",
    hatHook: "Sssalem says: negotiate the salary, then buy the hat.",
  },
  // Add apps here as they launch. Each entry triggers a card on the home page.
];
