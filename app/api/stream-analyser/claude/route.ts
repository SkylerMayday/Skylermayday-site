import { NextResponse } from "next/server";
import { env, hasAnthropicEnv } from "@/lib/env";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Pinned as a single named constant so a future bump (e.g. to a newer Sonnet
// generation) is a one-line change. See .pipeline/specs.md §0 / §8 flag #1 —
// claude-sonnet-4-6 is still an active model ID and matches the old app's
// behavior exactly; kept as-is to de-risk the port.
// Not exported: Next.js route handler modules may only export the
// recognized HTTP-method/config names, so a documentation-only mirror of
// this value lives in lib/stream-analyser/title-rating.ts instead — bump
// both together if the model ever changes.
const CLAUDE_MODEL = "claude-sonnet-4-6";

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const MAX_USER_CHARS = 20_000;
const MAX_SYSTEM_CHARS = 8_000;
const MIN_MAX_TOKENS = 1;
const MAX_MAX_TOKENS = 1500;
const DEFAULT_MAX_TOKENS = 1000;

interface ClaudeRequestBody {
  system?: unknown;
  user?: unknown;
  maxTokens?: unknown;
}

interface ValidatedClaudeRequest {
  system: string;
  user: string;
  maxTokens: number;
}

function validate(body: ClaudeRequestBody): ValidatedClaudeRequest | null {
  const user = typeof body.user === "string" ? body.user : "";
  if (!user || user.length > MAX_USER_CHARS) return null;

  const system = typeof body.system === "string" ? body.system : "";
  if (system.length > MAX_SYSTEM_CHARS) return null;

  let maxTokens = DEFAULT_MAX_TOKENS;
  if (typeof body.maxTokens === "number" && Number.isFinite(body.maxTokens)) {
    maxTokens = Math.min(MAX_MAX_TOKENS, Math.max(MIN_MAX_TOKENS, Math.floor(body.maxTokens)));
  }

  return { system, user, maxTokens };
}

export async function POST(request: Request) {
  let body: ClaudeRequestBody;
  try {
    body = (await request.json()) as ClaudeRequestBody;
  } catch {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  const data = validate(body);
  if (!data) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  if (!hasAnthropicEnv()) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const ip = getClientIp(request);
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", retryAfterSeconds: rate.retryAfterSeconds },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSeconds),
          "RateLimit-Limit": String(rate.limit),
          "RateLimit-Remaining": String(rate.remaining),
          "RateLimit-Reset": String(Math.ceil((rate.resetAtMs - Date.now()) / 1000)),
        },
      }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: data.maxTokens,
        system: data.system,
        messages: [{ role: "user", content: data.user }],
      }),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "upstream", detail: (err as Error).message },
      { status: 502 }
    );
  }

  const upstreamData = await upstream.json();
  if (!upstream.ok) {
    return NextResponse.json(
      { ok: false, error: "upstream", detail: upstreamData },
      { status: upstream.status }
    );
  }

  return NextResponse.json(upstreamData, { status: 200 });
}
