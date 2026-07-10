import { NextResponse } from "next/server";
import { hasTwitchEnv } from "@/lib/env";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { TwitchApiError } from "@/lib/twitch";
import { fetchChannelData, fetchVodClipCount } from "@/lib/stream-analyser/twitch-helix";

export const runtime = "nodejs";

const LOGIN_PATTERN = /^[a-zA-Z0-9_]{1,25}$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const login = searchParams.get("login");
  const vodId = searchParams.get("vodId");
  const broadcasterId = searchParams.get("broadcasterId");
  const startedAt = searchParams.get("startedAt");
  const durationSecondsParam = searchParams.get("durationSeconds");

  if (!hasTwitchEnv()) {
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
        },
      }
    );
  }

  if (vodId) {
    const durationSeconds = durationSecondsParam ? Number(durationSecondsParam) : NaN;
    if (!broadcasterId || !startedAt || !Number.isFinite(durationSeconds)) {
      return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
    }
    try {
      const clipCount = await fetchVodClipCount(vodId, broadcasterId, startedAt, durationSeconds);
      return NextResponse.json({ ok: true, clipCount });
    } catch (err) {
      const message = err instanceof TwitchApiError ? err.message : "Twitch API error";
      return NextResponse.json({ ok: false, error: "upstream", detail: message }, { status: 502 });
    }
  }

  if (!login || !LOGIN_PATTERN.test(login)) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  try {
    const channel = await fetchChannelData(login);
    if (!channel) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, channel });
  } catch (err) {
    const message = err instanceof TwitchApiError ? err.message : "Twitch API error";
    return NextResponse.json({ ok: false, error: "upstream", detail: message }, { status: 502 });
  }
}
