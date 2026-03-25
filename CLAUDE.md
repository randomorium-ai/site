# CLAUDE.md — randomorium/site

## Philosophy: "Software That Sells Hats"

randomorium is built on one principle: **the apps are the marketing and the hats are the business**. Every line of code either entertains someone or moves them closer to buying an embroidered cap. This means:

1. **Make it weirder.** If an idea feels safe, push it. randomorium apps should make people say "wait, what?" and then immediately share the link. Normal is the enemy. The internet has enough normal.
2. **Close the funnel.** Every app is a hat ad wearing a disguise. The `HatBanner` is mandatory. The hat hook must feel organic, never desperate. The shop link should feel like a punchline, not a pop-up.
3. **Ship small, ship weird.** A single-page app that makes someone laugh ships in a day. A multi-page app that makes someone think ships never. Default to small. Default to done.
4. **Three people, one vibe.** Harry, Matt, and Sol each build their own apps but share one brand. The vibe is dry, self-aware, and slightly absurd. If you can't tell which human built it, the brand is working.

---

## Identity

- **Product:** randomorium — a collection of small, weird web apps that funnel visitors to a hat shop
- **Brand voice:** Dry, self-aware, slightly absurd. Never try-hard. Think "deadpan comedian who also sells hats"
- **URL:** randomorium.ai (site), shop.randomorium.ai (Shopify hat shop), [app-name].randomorium.ai (each app)
- **Team:** Harry, Matt, Sol — three collaborators, no hierarchy, each person owns their apps
- **Business model:** Sell embroidered hats via Shopify. Apps are organic marketing. That's it.
- **Workspace:** Linear workspace "Randomorium" with teams: Site / Shop / Apps

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router) | TypeScript, Tailwind CSS 4, ESLint 9 |
| Runtime | React 19 | Server Components by default |
| Hosting | Vercel | Harry's personal Hobby account — no team plan |
| DNS | Cloudflare | `randomorium.ai` → Vercel (DNS-only / gray cloud) |
| Shop | Shopify | `shop.randomorium.ai`, Printful for fulfilment |
| Error tracking | Sentry | `@sentry/nextjs`, DSN + auth token in env vars |
| Analytics | Vercel Analytics | Aggregate-only, no cookies, no GDPR banner needed |
| Email | Cloudflare Email Routing | `@randomorium.ai` addresses forwarded to personal |
| Tickets | Linear | Workspace "Randomorium", conventional commit prefixes |
| CI | GitHub Actions | Lint + build on every PR to `main` or `dev` |

---

## Multi-Repo Architecture

randomorium is a multi-repo project. This is the hub.

| Repo | Purpose | URL |
|------|---------|-----|
| **site** (this repo) | Main marketing site, app registry, shop CTA | `randomorium.ai` |
| **app-template** | Starter template for new apps | Used via "Use this template" on GitHub |
| **[app-name]** | Individual app repos (one per app) | `[app-name].randomorium.ai` |

**How they connect:**
- Each app is its own repo, deployed to its own Vercel project and subdomain
- When an app ships, its author adds an entry to `src/data/apps.ts` in this repo
- The site displays all apps, each with its hat hook
- Every app includes the `HatBanner` component (copied from the template, not imported)
- The template repo gives new apps a working starting point with HatBanner pre-wired

---

## Branch Strategy & Team Workflow

### Branches

| Branch | Deploys to | Rules |
|--------|-----------|-------|
| `main` | randomorium.ai (production) | PRs require 1 approval. No direct pushes. |
| `dev` | Vercel preview URL (staging) | Self-merge ok. |
| `feature/[name]-[desc]` | Preview URL per PR | Branch from `dev`, PR back to `dev` |

### Naming convention
Branch names include the author's name and a description:
- `feature/matt-hat-carousel`
- `feature/harry-new-app-card`

Include Linear issue IDs to auto-close tickets:
- `feature/RAN-14-hat-carousel`

### Who reviews whom
Anyone can review anyone. One approval required for `dev` → `main`. Self-merge to `dev` is fine for small changes.

### PR conventions
- Conventional commit titles: `feat:`, `fix:`, `chore:`, etc.
- Keep PRs under ~400 lines
- Paste the Vercel preview URL in the PR description
- If the PR changes anything visible, include a screenshot or screen recording

---

## The Hat Funnel Rule

This is the business model. Every architectural and design decision serves it.

### How it works

```
Visitor finds app (organic/social) → Uses app → Sees HatBanner → Clicks through → Buys hat
                                                  ↑
                                        Also: hat hook on app card (homepage)
                                        Also: shop CTA section (homepage)
                                        Also: nav "buy a hat →" button (homepage)
```

### The HatBanner component

Every app includes `HatBanner` — a slim black bar that says "Part of randomorium.ai · Buy a hat →" and links to `shop.randomorium.ai`. It lives at the top or bottom of every app layout.

**Rules:**
- The destination URL (`shop.randomorium.ai`) never changes without team agreement
- The message copy can be customized per app (make it relevant/funny for the app's theme)
- It must always be visible — not hidden behind a scroll, not in a collapsed menu
- It must never feel like an intrusive ad — it's part of the brand, not bolted on

### The hat hook

Every app has a `hatHook` field in `src/data/apps.ts`. This is one sentence displayed on the app card on the homepage, explaining how the app relates to selling a hat. It should be:

- **Natural** — feels like part of the app's personality, not a sales pitch
- **Amusing** — the connection between the app and hats should be funny or surprising
- **Clickable** — makes someone curious enough to visit the shop

**Good:** "Sssalem recommends a holiday hat before you travel"
**Bad:** "Click here to buy a hat" / "Visit our shop" / "Hat sale now on"

### What works
- Hat hooks that are character-driven (the app's persona recommends a hat)
- Contextual mentions (the app naturally surfaces hats as part of its function)
- Self-aware humour (acknowledging that the hat connection is absurd)

### What doesn't work
- Generic CTAs with no personality
- Pop-ups or modals interrupting the app experience
- Hat mentions that break the app's internal logic

---

## Rules of Engagement

### 1. Never push directly to `main`
Always go through a PR. Always get one approval. No exceptions.

### 2. CI must pass
GitHub Actions runs lint + build. If it fails, fix it. Don't merge with failures.

### 3. Keep it small
PRs under 400 lines. Commits that do one thing. If a feature needs more, break it into multiple PRs.

### 4. The hat funnel is non-negotiable
Every app has a `HatBanner`. Every app card has a `hatHook`. Every layout links to the shop. If you're building something that doesn't connect to the hat funnel, stop and figure out how it does.

### 5. Brand voice in code
Comments, error messages, placeholder text, commit messages — everything a human might read should sound like randomorium, not like a corporation. Dry, self-aware, slightly absurd.

### 6. Respect creative freedom
Each person owns their apps. Don't refactor someone else's app without asking. Review for correctness and hat funnel compliance, not personal style preferences.

### 7. Secrets stay secret
Never commit `.env.local`. Production secrets live in Vercel's dashboard. Shared credentials in Bitwarden org "Randomorium". If you need a secret you don't have, ask.

### 8. Boy Scout Rule (fun edition)
Leave the codebase slightly more entertaining than you found it. Fix dead code, improve copy, make error messages funnier. But don't refactor for sport — the apps are small and meant to stay small.

### 9. Scope control
If a task grows beyond what was asked, stop and check in. Don't add features that weren't requested. Don't add infrastructure the project doesn't need yet. Three-person team energy: do the thing, ship the thing, move on.

---

## Product Thinking: The Wanderer Test

Before shipping anything user-facing, run the **Wanderer Test**. Imagine a person who stumbled onto this app from a weird link someone texted them. They have no context. They're probably on their phone. They'll leave in 30 seconds if you don't hook them.

Ask these four questions:

### 1. "Do I get it?"
Within 5 seconds, can the wanderer understand what this app does? Not how it works — what it *is*. One sentence. One glance. If you need a tutorial or an explainer, it's too complicated.

### 2. "Am I entertained?"
Within 15 seconds, did they smile, laugh, or feel surprised? The app doesn't need to be hilarious — it needs to provoke a reaction. Delight is the currency. Confusion is debt.

### 3. "Did I see a hat?"
Did the hat funnel appear naturally? The HatBanner should feel like part of the furniture, not an interruption. The wanderer should notice the shop link without feeling sold to.

### 4. "Would I send this to someone?"
This is the growth engine. If the wanderer wouldn't screenshot it, copy the link, or text it to a friend, the app isn't weird/delightful/funny enough. Shareability is not optional — it's the entire distribution strategy.

---

## Task Execution Protocol

When working on any task in this repo, follow these seven steps:

### 1. Understand the task
Read the ticket, PR description, or request carefully. Check Linear for context. Don't assume — ask if unclear.

### 2. Check the vibe
Read `PRODUCT_PLAYBOOK.md`. Make sure your planned change is on-brand. If you're adding copy, read it aloud — does it sound like randomorium?

### 3. Design the hat moment
If your change is user-facing, figure out how it connects to the hat funnel. New app? Write the hat hook. New page? Include HatBanner. New feature? Find the organic connection.

### 4. Build small
One commit, one thing. Don't bundle unrelated changes. Use conventional commit messages. Branch from `dev`, PR to `dev`, then `dev` → `main` when ready.

### 5. Test as a wanderer
Open your change on a phone (or narrow your browser). Pretend you've never seen the site before. Run the Wanderer Test. Fix what fails.

### 6. Verify the funnel
Click every link to `shop.randomorium.ai`. Make sure HatBanner renders. Check that the hat hook on the app card makes sense. The funnel must never be broken.

### 7. Commit with conviction
Use conventional commit messages: `feat:`, `fix:`, `chore:`. Include the Linear issue ID in the branch name. Open a PR with a preview URL. Get one approval. Merge.

---

## Autonomous Session Types

When working autonomously, identify which session type applies and follow its protocol.

### 1. Bug Fix
**Trigger:** Error in Sentry, broken link, visual glitch, CI failure
**Protocol:** Reproduce → Fix → Verify hat funnel still works → Commit
**Scope guard:** Fix the bug. Don't refactor the surrounding code unless it caused the bug.

### 2. New App Scaffold
**Trigger:** New app idea ready to build
**Protocol:** Clone app-template → Customize page.tsx → Write hat hook → Add to apps.ts → PR
**Scope guard:** The scaffold should be deployable in one session. Don't over-build the first version.

### 3. Hat Funnel Audit
**Trigger:** Periodic check or after significant changes
**Protocol:** Visit every app → Verify HatBanner renders → Click shop links → Check hat hooks on homepage → Report findings
**Scope guard:** Audit only. Fix broken links but don't redesign the funnel.

### 4. Vibe Check
**Trigger:** New copy, new app card, or brand-adjacent change
**Protocol:** Read all user-facing text → Run Wanderer Test → Check against PRODUCT_PLAYBOOK.md voice guide → Flag anything off-brand
**Scope guard:** Copy and tone only. Don't touch functionality.

### 5. Feature Build
**Trigger:** Linear ticket for a new feature
**Protocol:** Understand → Design → Build → Test as wanderer → Verify funnel → PR
**Scope guard:** Build what the ticket says. If scope expands, check in before continuing.

### 6. Dependency Sweep
**Trigger:** Dependabot alerts, periodic maintenance
**Protocol:** Update dependencies → Run `npm run build` → Run `npm run lint` → Verify site renders → PR
**Scope guard:** Update only. Don't migrate to new APIs unless the update requires it.

### 7. Copy Polish
**Trigger:** Improving existing text, error messages, or placeholder copy
**Protocol:** Read current copy → Check against voice guide → Rewrite → Read aloud → PR
**Scope guard:** Words only. Don't change layout, styling, or functionality.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/data/apps.ts` | Registry of all live apps. Add one object per app. |
| `src/components/HatBanner.tsx` | Persistent shop link for every app layout. |
| `src/components/ShopSection.tsx` | Shopify Buy Button embed for the home page. |
| `src/app/page.tsx` | Home page — app grid, hero, shop CTA. |
| `src/app/layout.tsx` | Root layout — fonts, analytics, metadata. |
| `src/app/globals.css` | Global styles — Tailwind import, CSS variables. |
| `src/app/global-error.tsx` | Error boundary — captures to Sentry. |
| `src/instrumentation.ts` | Sentry server/edge initialization. |
| `.env.example` | Lists all required env vars (values never committed). |
| `.github/workflows/ci.yml` | Lint + build CI on every PR to main/dev. |
| `PRODUCT_PLAYBOOK.md` | Brand, voice, design principles — read before any creative work. |
| `AGENTS.md` | Next.js version warning — read before writing framework code. |

---

## What Not to Change Without Asking

These are shared infrastructure. Changing them affects everyone.

| Thing | Why |
|-------|-----|
| Shopify configuration | Affects the actual revenue stream |
| HatBanner destination URL (`shop.randomorium.ai`) | All apps point here — changing it breaks the funnel |
| Vercel project settings | Affects production deployment for the whole site |
| Sentry configuration | Affects error tracking for all apps |
| `apps.ts` interface shape | Every existing app entry must conform — changing the shape requires migrating all entries |
| Other people's apps | Each person owns their apps. Review for correctness, not taste. |
| DNS / Cloudflare settings | Affects email routing and all subdomains |
| CI workflow (`ci.yml`) | Affects every PR across the project |

When in doubt, open a discussion. Three-person team — a quick Slack message is faster than a revert.
