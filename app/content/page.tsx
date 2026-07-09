import type { Metadata } from "next";
import { fetchTwitchClips, fetchTwitchVods } from "@/lib/twitch";
import { fetchYouTubeVideos } from "@/lib/youtube";
import { hasTwitchEnv, hasYouTubeEnv } from "@/lib/env";
import type { ContentItem } from "@/lib/content-types";
import PlatformFilter, { type SourceFailures } from "@/components/content/PlatformFilter";
import TikTokEmbeds from "@/components/content/TikTokEmbeds";
import InstagramEmbeds from "@/components/content/InstagramEmbeds";
import { siteConfig } from "@/data/site-config";

export const revalidate = 1800; // 30 min

export const metadata: Metadata = {
  title: `Content — ${siteConfig.brandName}`,
};

async function getContentItems(): Promise<{ items: ContentItem[]; sourceFailures: SourceFailures }> {
  const [clipsResult, vodsResult, youtubeResult] = await Promise.allSettled([
    hasTwitchEnv() ? fetchTwitchClips() : Promise.reject(new Error("Twitch env not configured")),
    hasTwitchEnv() ? fetchTwitchVods() : Promise.reject(new Error("Twitch env not configured")),
    hasYouTubeEnv() ? fetchYouTubeVideos() : Promise.reject(new Error("YouTube env not configured")),
  ]);

  const items: ContentItem[] = [];
  let twitchFailed = false;
  let youtubeFailed = false;

  if (clipsResult.status === "fulfilled") {
    items.push(...clipsResult.value);
  } else {
    twitchFailed = true;
    console.warn("[content] Twitch clips fetch failed:", clipsResult.reason);
  }

  if (vodsResult.status === "fulfilled") {
    items.push(...vodsResult.value);
  } else {
    twitchFailed = true;
    console.warn("[content] Twitch VODs fetch failed:", vodsResult.reason);
  }

  if (youtubeResult.status === "fulfilled") {
    items.push(...youtubeResult.value);
  } else {
    youtubeFailed = true;
    console.warn("[content] YouTube fetch failed:", youtubeResult.reason);
  }

  items.sort((a, b) => {
    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bTime - aTime;
  });

  return { items, sourceFailures: { twitch: twitchFailed, youtube: youtubeFailed } };
}

export default async function ContentPage() {
  const { items, sourceFailures } = await getContentItems();

  return (
    <div className="flex flex-col gap-8 py-10">
      <h1 className="text-3xl font-bold">Content</h1>
      <PlatformFilter
        items={items}
        sourceFailures={sourceFailures}
        tiktokSlot={<TikTokEmbeds />}
        instagramSlot={<InstagramEmbeds />}
      />
    </div>
  );
}
