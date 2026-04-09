// Monthly cron: re-fetches Wikipedia data for active (non-retired) players,
// updates current_club / career_goals / career_apps / retirement status,
// commits the result to GitHub, and optionally emails a summary.
//
// Schedule: 3am on 1st of every month (see vercel.json)
// Auth: x-vercel-cron header (Vercel) or Authorization: Bearer $CRON_SECRET (manual)

import { NextRequest, NextResponse } from "next/server"
import type { Player } from "@/lib/player"
import playersData from "@/data/players.json"

const PLAYERS = playersData as unknown as Player[]

// ── Auth ───────────────────────────────────────────────────────────────────────

function isAuthorised(req: NextRequest): boolean {
  if (req.headers.get("x-vercel-cron") === "1") return true
  const auth = req.headers.get("authorization") ?? ""
  const secret = process.env.CRON_SECRET
  if (secret && auth === `Bearer ${secret}`) return true
  return false
}

// ── Wikipedia fetch ────────────────────────────────────────────────────────────

async function fetchWikiSummary(wikiUrl: string): Promise<{ extract: string; description: string } | null> {
  try {
    const title = wikiUrl.split("/wiki/").pop() ?? ""
    if (!title) return null
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`,
      { headers: { "User-Agent": "randomorium-football-bot/1.0" }, signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return null
    const data = await res.json() as { extract?: string; description?: string }
    return { extract: data.extract ?? "", description: data.description ?? "" }
  } catch {
    return null
  }
}

function extractCurrentClub(extract: string): string | null {
  const m = extract.match(/(?:currently plays|playing) for ([A-Z][^,.]{2,40})/i)
  return m ? m[1].trim() : null
}

function detectRetirement(extract: string): boolean {
  return /\b(retired|former professional footballer)\b/i.test(extract)
}

function detectManagerRole(extract: string, description: string): string | null {
  if (!/\b(manager|head coach)\b/i.test(description + " " + extract)) return null
  const m = extract.match(/(?:manager|head coach) of ([A-Z][^,.]{2,40})/i)
  return m ? m[1].trim() : ""
}

// ── GitHub commit ──────────────────────────────────────────────────────────────

async function commitToGitHub(players: Player[], dateStr: string): Promise<{ committed: boolean; url?: string }> {
  const token = process.env.GITHUB_TOKEN
  if (!token) return { committed: false }

  const owner = process.env.GITHUB_REPO_OWNER ?? "randomorium-ai"
  const repo = process.env.GITHUB_REPO_NAME ?? "site"
  const branch = "main"
  const filePath = "src/data/players.json"
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  }

  const shaRes = await fetch(`${apiUrl}?ref=${branch}`, { headers })
  if (!shaRes.ok) return { committed: false }
  const { sha } = await shaRes.json() as { sha: string }

  const content = Buffer.from(JSON.stringify(players, null, 2)).toString("base64")
  const putRes = await fetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `chore: monthly player database refresh — ${dateStr}`,
      content,
      sha,
      branch,
    }),
  })

  if (!putRes.ok) return { committed: false }
  const result = await putRes.json() as { commit?: { html_url?: string } }
  return { committed: true, url: result.commit?.html_url }
}

// ── Summary email ──────────────────────────────────────────────────────────────

async function sendSummaryEmail(summary: {
  updated: number; clubChanges: string[]; newRetirements: string[]; newManagers: string[]; dateStr: string
}) {
  const emailTo = process.env.NOTIFY_EMAIL
  const resendKey = process.env.RESEND_API_KEY
  if (!emailTo || !resendKey) return

  const body = [
    `Monthly player DB refresh — ${summary.dateStr}`,
    `${summary.updated} players updated`,
    "",
    summary.clubChanges.length ? `Club changes:\n${summary.clubChanges.map(s => `  • ${s}`).join("\n")}` : "No club changes.",
    "",
    summary.newRetirements.length ? `New retirements:\n${summary.newRetirements.map(s => `  • ${s}`).join("\n")}` : "No new retirements.",
    "",
    summary.newManagers.length ? `Now managing:\n${summary.newManagers.map(s => `  • ${s}`).join("\n")}` : "No new managers.",
  ].join("\n")

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "noreply@randomorium.ai",
      to: emailTo,
      subject: `Player DB refresh — ${summary.dateStr}`,
      text: body,
    }),
  })
}

// ── Handler ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const dateStr = now.toISOString().split("T")[0]
  const MIN_DAYS = 25
  const cutoffDate = new Date(now.getTime() - MIN_DAYS * 86400000).toISOString().split("T")[0]

  // Work on a mutable copy — never mutate the imported module
  const players: (Player & { last_updated?: string; retired_date?: string })[] =
    JSON.parse(JSON.stringify(PLAYERS))

  const clubChanges: string[] = []
  const newRetirements: string[] = []
  const newManagers: string[] = []
  let updatedCount = 0

  for (const player of players) {
    // Never touch retired players
    if (player.retired) continue

    // Skip if updated recently
    if (player.last_updated && player.last_updated >= cutoffDate) continue

    const wiki = await fetchWikiSummary(player.wikipedia_url)
    if (!wiki) continue

    let changed = false

    // Retirement check
    if (detectRetirement(wiki.extract)) {
      player.retired = true
      player.current_club = ""
      player.retired_date = dateStr
      newRetirements.push(player.name)
      changed = true
    }

    // Manager check
    if (!player.is_manager) {
      const mgClub = detectManagerRole(wiki.extract, wiki.description)
      if (mgClub !== null) {
        player.is_manager = true
        player.managing_club = mgClub || null
        newManagers.push(`${player.name}${mgClub ? ` → ${mgClub}` : ""}`)
        changed = true
      }
    }

    // Club change (only if still active)
    if (!player.retired) {
      const newClub = extractCurrentClub(wiki.extract)
      if (newClub && newClub !== player.current_club) {
        clubChanges.push(`${player.name}: ${player.current_club || "—"} → ${newClub}`)
        player.current_club = newClub
        changed = true
      }
    }

    if (changed) {
      player.last_updated = dateStr
      updatedCount++
    }
  }

  if (updatedCount === 0) {
    return NextResponse.json({ updated: 0, message: "No changes — skipping commit" })
  }

  const { committed, url } = await commitToGitHub(players, dateStr)
  await sendSummaryEmail({ updated: updatedCount, clubChanges, newRetirements, newManagers, dateStr })

  return NextResponse.json({ updated: updatedCount, clubChanges, newRetirements, newManagers, committed, commitUrl: url ?? null })
}
