export interface App {
  name: string
  slug: string
  description: string
  url: string
  author: string
  builtWith: string
  hatHook: string
}

export const apps: App[] = [
  // Add apps here as they launch. Each entry triggers a card on the home page.
  // Example:
  // {
  //   name: "HatGPT",
  //   slug: "hatgpt",
  //   description: "Ask the AI what hat you are",
  //   url: "https://hatgpt.randomorium.ai",
  //   author: "harry",
  //   builtWith: "Next.js + Claude API",
  //   hatHook: "Quiz results recommend the matching hat",
  // },
]
