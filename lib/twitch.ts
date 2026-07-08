import { env } from "./env";
import type { ContentItem } from "./content-types";

export class TwitchApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TwitchApiError";
  }
}

const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const HELIX_BASE = "https://api.twitch.tv/helix";
const DEFAULT_CLIP_LIMIT = 12;
const DEFAULT_VOD_LIMIT = 12;
const CLIPS_WINDOW_DAYS = 30;
const TOKEN_REFRESH_SKEW_MS = 60_000; // refresh when within 60s of expiry

interface CachedToken {
  token: string;
  expiresAtMs: number;
}

// Module-level cache: survives across requests within the same server
// process/lambda instance for the token's TTL.
let cachedToken: CachedToken | null = null;

/**
 * App Access Token via client_credentials. Cached in-module for its TTL;
 * refreshed automatically once within 60s of expiry.
 */
export async function getTwitchAppToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAtMs - TOKEN_REFRESH_SKEW_MS > now) {
    return cachedToken.token;
  }

  const url = new URL(TOKEN_URL);
  url.searchParams.set("client_id", env.TWITCH_CLIENT_ID);
  url.searchParams.set("client_secret", env.TWITCH_CLIENT_SECRET);
  url.searchParams.set("grant_type", "client_credentials");

  let response: Response;
  try {
    response = await fetch(url.toString(), { method: "POST" });
  } catch (err) {
    throw new TwitchApiError(
      `Network error requesting Twitch app token: ${(err as Error).message}`
    );
  }

  if (!response.ok) {
    throw new TwitchApiError(
      `Twitch token exchange failed: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    token: data.access_token,
    expiresAtMs: now + data.expires_in * 1000,
  };

  return cachedToken.token;
}

async function helixGet(
  path: string,
  params: Record<string, string>
): Promise<Record<string, unknown>> {
  const token = await getTwitchAppToken();
  const url = new URL(`${HELIX_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: {
        "Client-Id": env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    throw new TwitchApiError(
      `Network error calling Twitch Helix ${path}: ${(err as Error).message}`
    );
  }

  if (!response.ok) {
    throw new TwitchApiError(
      `Twitch Helix ${path} failed: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as Record<string, unknown>;
}

/** Substitutes Twitch's `%{width}x%{height}` thumbnail URL template with real dimensions. */
function resolveThumbnailTemplate(
  templateUrl: string | undefined,
  width = 480,
  height = 272
): string | null {
  if (!templateUrl) return null;
  return templateUrl
    .replace("%{width}", String(width))
    .replace("%{height}", String(height));
}

/** Parses Twitch's `1h2m3s`-style duration string into total seconds. */
function parseTwitchDuration(duration: string | undefined): number | null {
  if (!duration) return null;
  const match = duration.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  if (hours === 0 && minutes === 0 && seconds === 0 && duration !== "0s") {
    return null;
  }
  return hours * 3600 + minutes * 60 + seconds;
}

interface TwitchClipRaw {
  id: string;
  url: string;
  title: string;
  thumbnail_url?: string;
  view_count?: number;
  duration?: number; // clips report duration as a plain number (seconds)
  created_at?: string;
}

/** Top clips for the broadcaster over a trailing window (default 30 days), newest-first fallback. */
export async function fetchTwitchClips(
  limit: number = DEFAULT_CLIP_LIMIT
): Promise<ContentItem[]> {
  const startedAt = new Date(
    Date.now() - CLIPS_WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const data = await helixGet("/clips", {
    broadcaster_id: env.TWITCH_BROADCASTER_ID,
    first: String(limit),
    started_at: startedAt,
  });

  const clips = (data.data ?? []) as TwitchClipRaw[];

  return clips.map((clip) => ({
    id: clip.id,
    platform: "twitch-clip" as const,
    title: clip.title,
    url: clip.url,
    thumbnailUrl: resolveThumbnailTemplate(clip.thumbnail_url),
    viewCount: typeof clip.view_count === "number" ? clip.view_count : null,
    publishedAt: clip.created_at ?? null,
    durationSec: typeof clip.duration === "number" ? clip.duration : null,
  }));
}

interface TwitchVodRaw {
  id: string;
  url: string;
  title: string;
  thumbnail_url?: string; // contains %{width}x%{height} template
  view_count?: number;
  duration?: string; // "1h2m3s" format
  published_at?: string;
}

/** Recent VODs (videos type=archive) for the broadcaster. */
export async function fetchTwitchVods(
  limit: number = DEFAULT_VOD_LIMIT
): Promise<ContentItem[]> {
  const data = await helixGet("/videos", {
    user_id: env.TWITCH_BROADCASTER_ID,
    type: "archive",
    first: String(limit),
  });

  const vods = (data.data ?? []) as TwitchVodRaw[];

  return vods.map((vod) => ({
    id: vod.id,
    platform: "twitch-vod" as const,
    title: vod.title,
    url: vod.url,
    thumbnailUrl: resolveThumbnailTemplate(vod.thumbnail_url),
    viewCount: typeof vod.view_count === "number" ? vod.view_count : null,
    publishedAt: vod.published_at ?? null,
    durationSec: parseTwitchDuration(vod.duration),
  }));
}
