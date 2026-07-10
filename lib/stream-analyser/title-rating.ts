/**
 * Client-side Claude relay helper + response parser. Ported from
 * index.html:5959-5974 (callClaude) — the actual Anthropic `fetch` + api-key
 * now lives server-side in app/api/stream-analyser/claude/route.ts; this
 * function just POSTs to that same-origin route and extracts the text
 * blocks from the passed-through Anthropic response shape.
 */

// Documentation-only mirror of the model id actually sent to Anthropic —
// the single source of truth is CLAUDE_MODEL in
// app/api/stream-analyser/claude/route.ts (the only place that calls the
// upstream API). Kept here too since specs.md §4 names it in this file;
// bump both together if the model ever changes.
export const CLAUDE_MODEL = "claude-sonnet-4-6";

const CLAUDE_ROUTE = "/api/stream-analyser/claude";

interface ClaudeContentBlock {
  type: string;
  text?: string;
}

interface ClaudeMessageResponse {
  content: ClaudeContentBlock[];
}

/** POSTs to the same-origin Claude relay and extracts joined text content. Ported from index.html:5959-5974. */
export async function callClaude(system: string, user: string, maxTokens: number): Promise<string> {
  const res = await fetch(CLAUDE_ROUTE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, user, maxTokens }),
  });

  if (!res.ok) {
    let msg: string | undefined;
    try {
      const body = (await res.json()) as { error?: string };
      msg = body.error;
    } catch {
      msg = await res.text();
    }
    throw new Error(msg || `HTTP ${res.status}`);
  }

  const data = (await res.json()) as ClaudeMessageResponse;
  return data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("");
}

/** Strips ```json fences and parses. Used by every AI card parser. */
export function parseClaudeJson<T>(raw: string): T {
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean) as T;
}
