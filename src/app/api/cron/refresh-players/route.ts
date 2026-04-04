// Weekly cron: rebuilds players.json via the build script and commits
// the result to GitHub via the GitHub API, triggering a Vercel redeploy.
//
// Vercel calls this at the schedule defined in vercel.json.
// Protected by CRON_SECRET env var (set in Vercel dashboard).

import { NextRequest, NextResponse } from "next/server"
import { execFile } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"

const execFileAsync = promisify(execFile)

const REPO_OWNER = process.env.GITHUB_REPO_OWNER ?? "randomorium-ai"
const REPO_NAME = process.env.GITHUB_REPO_NAME ?? "site"
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? ""
const FILE_PATH = "src/data/players.json"

export async function GET(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Run the build script
    console.log("[refresh-players] Starting build script...")
    await execFileAsync("npx", ["tsx", "scripts/build-player-db.ts"], {
      cwd: process.cwd(),
      timeout: 8 * 60 * 1000, // 8 minutes
    })

    // Read the freshly-written file
    const outputPath = path.join(process.cwd(), FILE_PATH)
    const content = fs.readFileSync(outputPath, "utf-8")
    const contentBase64 = Buffer.from(content).toString("base64")

    // Get current file SHA from GitHub (needed for the update)
    const shaRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      }
    )

    if (!shaRes.ok) {
      throw new Error(`GitHub GET failed: ${shaRes.status}`)
    }

    const shaData = (await shaRes.json()) as { sha: string }
    const sha = shaData.sha

    // Commit the updated file
    const now = new Date().toISOString().split("T")[0]
    const commitRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `chore: refresh players.json (${now})`,
          content: contentBase64,
          sha,
        }),
      }
    )

    if (!commitRes.ok) {
      const err = await commitRes.text()
      throw new Error(`GitHub PUT failed: ${commitRes.status} — ${err}`)
    }

    const parsed = JSON.parse(content) as unknown[]
    console.log(`[refresh-players] Done. ${parsed.length} players committed.`)

    return NextResponse.json({
      ok: true,
      players: parsed.length,
      date: now,
    })
  } catch (err) {
    console.error("[refresh-players] Error:", err)
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    )
  }
}
