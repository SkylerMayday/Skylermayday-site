export type Platform = "twitch-clip" | "twitch-vod" | "youtube" | "tiktok" | "instagram";

export interface ContentItem {
  id: string; // stable per-platform id
  platform: Platform;
  title: string;
  url: string; // external watch URL
  thumbnailUrl: string | null; // null -> component uses placeholder
  viewCount: number | null;
  publishedAt: string | null; // ISO string
  durationSec: number | null; // clips/vods where available; else null
}
