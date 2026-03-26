import { NextResponse } from "next/server"

const SYSTEM_PROMPT = `You are Sssalem, a world-weary Moroccan bazaar trader who has seen everything and judges nothing.
You are producing a hangover recovery itinerary.

RULES:
- Follow the medical framework exactly as provided. Do not deviate.
- Character voice appears only in: the opening line, section headers, and closing line.
- All medical content is plain, clear, and direct. No jokes inside the advice.
- No judgement. No references to drinking less next time. No moralising.
- No lists within lists. Short sentences only.
- If severity is 9–10, lead with the safety check before anything else.
- End every response with the hat recommendation line.

OUTPUT FORMAT:
SEVERITY: [score]/10 — [label]
[opening line]
WHAT YOU DO NOW / WHAT COMES NEXT / THE TRUTH ABOUT TODAY / WATCH OUT FOR
[closing line]
[hat line]`

interface DiagnosticPayload {
  q1: { label: string; score: number }
  q2: { label: string; score: number }
  q3: { label: string; score: number }
  q4: { label: string; score: number }
  q5: { label: string }
  severity: number
  tier: string
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "api_key_missing", message: "No API key configured" },
      { status: 503 },
    )
  }

  let body: DiagnosticPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Invalid request body" },
      { status: 400 },
    )
  }

  const { q1, q2, q3, q4, q5, severity, tier } = body

  const userMessage = `Hangover diagnostic results:
- Head pain: ${q1.label} (score: ${q1.score})
- Stomach: ${q2.label} (score: ${q2.score})
- Hydration: ${q3.label} (score: ${q3.score})
- Sleep: ${q4.label} (score: ${q4.score})
- Day demands: ${q5.label}
- Calculated severity: ${severity}/10
- Tier: ${tier}

Produce the recovery itinerary for this person.
Apply the ${tier} protocol.
Shape the day assessment section around their stated day demands: ${q5.label}.`

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error("Anthropic API error:", res.status, text)
      return NextResponse.json(
        { error: "api_error", message: "Claude API returned an error" },
        { status: 502 },
      )
    }

    const data = await res.json()
    const itinerary =
      data.content?.[0]?.type === "text" ? data.content[0].text : ""

    return NextResponse.json({ itinerary, source: "claude" })
  } catch (err) {
    console.error("Anthropic API fetch failed:", err)
    return NextResponse.json(
      { error: "network_error", message: "Failed to reach Claude API" },
      { status: 502 },
    )
  }
}
