# randomorium/site — Claude context

## What this is
The main marketing site for **randomorium.ai** — a multi-repo project that publishes random web apps and funnels visitors toward a hat shop. This repo is the hub: it showcases all apps, tells the brand story, and embeds/links to `shop.randomorium.ai`.

## Stack
- **Next.js** (App Router, TypeScript, Tailwind CSS, ESLint)
- **Vercel** for hosting (Harry's personal Hobby account — no team plan)
- **Cloudflare** for DNS (`randomorium.ai` → Vercel, DNS-only / gray cloud)
- **Shopify** for the hat shop at `shop.randomorium.ai`
- **Sentry** for error tracking (`SENTRY_DSN` env var)
- **Vercel Analytics** (aggregate-only, no cookies, no GDPR banner needed)

## Team
- Harry, Matt, Sol — three collaborators
- Email: `@randomorium.ai` addresses forwarded via Cloudflare Email Routing
- Issues tracked in Linear workspace "Randomorium" → teams: Site / Shop / Apps

## Branch strategy
- `main` — always live at randomorium.ai. PRs require 1 approval. No direct pushes.
- `dev` — staging. Self-merge ok. Deploys to Vercel preview URL.
- `feature/[name]-[desc]` — branch from dev, PR back to dev. E.g. `feature/matt-hat-carousel`.
- Branch names include Linear issue IDs to auto-close: e.g. `feature/RAN-14-hat-carousel`.

## Key files
- `src/data/apps.ts` — registry of all live apps (add one object per app, then PR)
- `src/components/HatBanner.tsx` — persistent shop link shown in every app layout
- `src/components/ShopSection.tsx` — Shopify Buy Button embed for the home page
- `.env.example` — lists all required env vars (values never committed)
- `.github/workflows/ci.yml` — lint + build CI on every PR to main/dev

## The hat funnel rule
Every app must link to `shop.randomorium.ai`. `HatBanner` is included in every layout. App cards on the home page include a "hat hook" — one sentence explaining how the app could sell a hat.

## App registry pattern
Adding a new app = add one object to `src/data/apps.ts`, open a PR, get 1 approval, merge. Fields: `name`, `slug`, `description`, `url`, `author`, `builtWith`, `hatHook`.

## Secrets
- Never commit secrets. `.env.local` is gitignored.
- Production secrets live in Vercel's environment variables dashboard.
- `SENTRY_DSN` and `SENTRY_AUTH_TOKEN` needed for Sentry.
- Shared credentials stored in Bitwarden org "Randomorium".

## CI
GitHub Actions (`.github/workflows/ci.yml`) runs lint + build on every PR to `main` or `dev`. Required status check before merge.

## PR conventions
- Conventional commit titles: `feat:`, `fix:`, `chore:`, etc.
- Keep PRs under ~400 lines.
- Paste Vercel preview URL in PR description.

## Phase roadmap (from setup guide)
1. Foundation — GitHub org, email routing, Linear, credentials ✓
2. Main site — this repo, Next.js, Vercel deploy, Cloudflare DNS
3. CI/CD — branch rules, GitHub Actions, PR workflow, Linear integration
4. Hat shop — Shopify + Printful, shop.randomorium.ai subdomain
5. Observability — Sentry, Vercel Analytics, BetterStack uptime
6. New app workflow — app-template repo, HatBanner, app registry
