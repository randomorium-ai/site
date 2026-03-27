// ── Salary Negotiator — streaming SSE API route ─────────────────────────────
import { SYSTEM_PROMPT } from "@/lib/salary/prompts"

interface PlaybookRequest {
  userPrompt: string
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "api_key_missing", message: "No API key configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    )
  }

  let body: PlaybookRequest
  try {
    body = await request.json()
  } catch {
    return new Response(
      JSON.stringify({ error: "invalid_json", message: "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  if (!body.userPrompt) {
    return new Response(
      JSON.stringify({ error: "missing_prompt", message: "userPrompt is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  // Call Anthropic with streaming
  let anthropicRes: Response
  try {
    anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8000,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: body.userPrompt }],
      }),
    })
  } catch (err) {
    console.error("Anthropic API fetch failed:", err)
    return new Response(
      JSON.stringify({ error: "network_error", message: "Failed to reach Claude API" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    )
  }

  if (!anthropicRes.ok) {
    const status = anthropicRes.status
    const text = await anthropicRes.text()
    console.error("Anthropic API error:", status, text)

    if (status === 429) {
      return new Response(
        JSON.stringify({ error: "rate_limit", message: "The bazaar is busy" }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      )
    }

    return new Response(
      JSON.stringify({
        error: "api_error",
        message: "Claude API returned an error",
        detail: text.slice(0, 500),
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    )
  }

  // Transform Anthropic's SSE stream into simplified SSE for the client
  const anthropicBody = anthropicRes.body
  if (!anthropicBody) {
    return new Response(
      JSON.stringify({ error: "no_body", message: "Empty response from Claude API" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    )
  }

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      const reader = anthropicBody.getReader()
      let buffer = ""

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Process complete SSE events from Anthropic
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? "" // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const data = line.slice(6).trim()
            if (!data || data === "[DONE]") continue

            try {
              const event = JSON.parse(data)

              if (
                event.type === "content_block_delta" &&
                event.delta?.type === "text_delta" &&
                event.delta.text
              ) {
                // Re-emit as simplified SSE
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`),
                )
              }

              if (event.type === "message_stop") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"))
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }

        // Ensure we always send a DONE signal
        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      } catch (err) {
        console.error("Stream processing error:", err)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "stream_error" })}\n\n`),
        )
        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
