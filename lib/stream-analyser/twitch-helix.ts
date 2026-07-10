/**
 * Server-only Twitch Helix calls for the Stream Analyser channel route.
 * Reuses the app-token pattern from lib/twitch.ts (getTwitchAppToken) rather
 * than duplicating token-fetch/caching logic.
 */

import { env } from "@/lib/env";
import { getTwitchAppToken, TwitchApiError } from "@/lib/twitch";
import type { ChannelData } from "./types";

const HELIX_BASE = "https://api.twitch.tv/helix";

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

interface HelixUser {
  id: string;
  login: string;
  display_name: string;
  description: string;
  profile_image_url: string;
}

interface HelixChannel {
  title: string;
  game_name: string;
  tags: string[];
  broadcaster_language: string;
}

/**
 * Resolves a login to the aggregate `ChannelData` shape the UI needs:
 * user record, follower count, and channel metadata. Returns null if the
 * username doesn't exist (empty `users` response) — caller maps that to a
 * 404 `not_found`.
 */
export async function fetchChannelData(login: string): Promise<ChannelData | null> {
  const usersData = await helixGet("/users", { login });
  const users = (usersData.data ?? []) as HelixUser[];
  const user = users[0];
  if (!user) return null;

  const [followersData, channelData] = await Promise.all([
    helixGet("/channels/followers", { broadcaster_id: user.id, first: "1" }),
    helixGet("/channels", { broadcaster_id: user.id }),
  ]);

  const followers = typeof followersData.total === "number" ? followersData.total : 0;
  const channels = (channelData.data ?? []) as HelixChannel[];
  const channel = channels[0];

  return {
    id: user.id,
    login: user.login,
    displayName: user.display_name,
    description: user.description ?? "",
    profileImageUrl: user.profile_image_url ?? "",
    followers,
    title: channel?.title ?? "",
    category: channel?.game_name ?? "",
    tags: channel?.tags ?? [],
    language: channel?.broadcaster_language ?? "",
  };
}

interface HelixClip {
  id: string;
  video_id: string;
}

/**
 * Count of viewer-created clips for a given VOD.
 *
 * Twitch Helix `/clips` does not accept `video_id` as a filter — it requires
 * exactly one of `broadcaster_id`, `game_id`, or `id` (confirmed live: a
 * `video_id` param 400s with "the id or game_id or broadcaster_id query
 * parameter is required"). Clip objects do carry a `video_id` field though,
 * so instead we scope the query to the broadcaster and the VOD's own
 * start/end window (`started_at`/`ended_at` are required together — Helix
 * defaults `ended_at` to one week after `started_at` if omitted, which would
 * pull in unrelated clips), then filter client-side for clips whose
 * `video_id` matches this VOD.
 *
 * Known limit: `first` is capped at 100 and this doesn't paginate, so a VOD
 * with >100 clips inside its own time window would undercount. Not solved
 * here — acceptable for a benchmark-row nice-to-have.
 */
export async function fetchVodClipCount(
  vodId: string,
  broadcasterId: string,
  startedAt: string,
  durationSeconds: number
): Promise<number> {
  const startedAtDate = new Date(startedAt);
  const endedAtDate = new Date(startedAtDate.getTime() + durationSeconds * 1000);
  const data = await helixGet("/clips", {
    broadcaster_id: broadcasterId,
    started_at: startedAtDate.toISOString(),
    ended_at: endedAtDate.toISOString(),
    first: "100",
  });
  const clips = (data.data ?? []) as HelixClip[];
  return clips.filter((clip) => clip.video_id === vodId).length;
}
