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
  {
    name: "Split the Bill",
    slug: "split",
    description: "Split restaurant bills fairly — with items, tip, and no arguments",
    url: "/apps/split",
    author: "harry",
    builtWith: "Next.js",
    hatHook: "Still arguing about the bill? Buy everyone a hat instead.",
  },
  {
    name: "Half-Life",
    slug: "half-life",
    description: "Track your caffeine in real time — see your decay curve and when it's safe to sleep",
    url: "/apps/half-life",
    author: "harry",
    builtWith: "Next.js",
    hatHook: "Still wired? A hat won't help, but it won't hurt either.",
  },
  {
    name: "Worth It?",
    slug: "worth-it",
    description: "See what your small daily expenses actually cost you over a year",
    url: "/apps/worth-it",
    author: "harry",
    builtWith: "Next.js",
    hatHook: "Is a hat worth it? Absolutely. Always.",
  },
  {
    name: "Time Worth",
    slug: "time-worth",
    description: "What you earn per second — and what everything costs in hours of your life",
    url: "/apps/time-worth",
    author: "harry",
    builtWith: "Next.js",
    hatHook: "A hat costs less work than you think. Treat yourself.",
  },
  // Add apps here as they launch. Each entry triggers a card on the home page.
];
