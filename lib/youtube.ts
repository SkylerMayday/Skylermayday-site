import { env } from "./env";
import type { ContentItem } from "./content-types";

export class YouTubeApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YouTubeApiError";
  }
}

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const DEFAULT_LIMIT = 12;

interface ChannelsResponse {
  items?: Array<{
    contentDetails?: {
      relatedPlaylists?: {
        uploads?: string;
      };
    };
  }>;
}

interface PlaylistItemsResponse {
  items?: Array<{
    contentDetails?: {
      videoId?: string;
      videoPublishedAt?: string;
    };
    snippet?: {
      title?: string;
      publishedAt?: string;
      thumbnails?: {
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
  }>;
}

async function youtubeGet<T>(
  path: string,
  params: Record<string, string>
): Promise<T> {
  const url = new URL(`${YOUTUBE_API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("key", env.YOUTUBE_API_KEY);

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch (err) {
    throw new YouTubeApiError(
      `Network error calling YouTube ${path}: ${(err as Error).message}`
    );
  }

  if (!response.ok) {
    throw new YouTubeApiError(
      `YouTube ${path} failed: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as T;
}

/**
 * Fetches recent uploads from the configured YouTube channel.
 *
 * Two-step, public/no-OAuth flow:
 *   1. Resolve the channel's uploads playlist id.
 *   2. List items from that playlist.
 *
 * View-count enrichment (a third call to `videos?part=statistics`) is a
 * Phase 1 optional step — skipped here, so `viewCount` is always `null`.
 * ContentCard hides the view count line when null, which is an acceptable
 * Phase 1 trade-off per spec §3.3.
 */
export async function fetchYouTubeVideos(
  limit: number = DEFAULT_LIMIT
): Promise<ContentItem[]> {
  const channelsData = await youtubeGet<ChannelsResponse>("/channels", {
    part: "contentDetails",
    id: env.YOUTUBE_CHANNEL_ID,
  });

  const uploadsPlaylistId =
    channelsData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) {
    throw new YouTubeApiError(
      "Could not resolve uploads playlist for configured YOUTUBE_CHANNEL_ID"
    );
  }

  const playlistData = await youtubeGet<PlaylistItemsResponse>(
    "/playlistItems",
    {
      part: "snippet,contentDetails",
      playlistId: uploadsPlaylistId,
      maxResults: String(limit),
    }
  );

  const items = playlistData.items ?? [];

  return items
    .filter((item) => item.contentDetails?.videoId)
    .map((item) => {
      const videoId = item.contentDetails!.videoId!;
      const thumbnailUrl =
        item.snippet?.thumbnails?.medium?.url ??
        item.snippet?.thumbnails?.default?.url ??
        null;

      return {
        id: videoId,
        platform: "youtube" as const,
        title: item.snippet?.title ?? "Untitled",
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnailUrl,
        viewCount: null, // P1: enrich via videos?part=statistics if needed
        publishedAt:
          item.contentDetails?.videoPublishedAt ??
          item.snippet?.publishedAt ??
          null,
        durationSec: null,
      };
    });
}
