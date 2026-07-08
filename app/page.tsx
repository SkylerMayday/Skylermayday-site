import Hero from "@/components/home/Hero";
import ContentTeaser from "@/components/home/ContentTeaser";
import QuickLinks from "@/components/home/QuickLinks";
import { fetchTwitchClips } from "@/lib/twitch";
import { fetchYouTubeVideos } from "@/lib/youtube";
import { hasTwitchEnv, hasYouTubeEnv } from "@/lib/env";
import type { ContentItem } from "@/lib/content-types";

export const revalidate = 900; // 15 min

async function getTeaserItems(): Promise<{ items: ContentItem[]; failed: boolean }> {
  const results = await Promise.allSettled([
    hasTwitchEnv() ? fetchTwitchClips(2) : Promise.resolve([]),
    hasYouTubeEnv() ? fetchYouTubeVideos(1) : Promise.resolve([]),
  ]);

  const fulfilled = results.filter(
    (result): result is PromiseFulfilledResult<ContentItem[]> => result.status === "fulfilled"
  );

  for (const result of results) {
    if (result.status === "rejected") {
      console.warn("[home] Content source failed:", result.reason);
    }
  }

  // Home must never fail to render because an API is down — only treat
  // this as a hard failure when every source rejected.
  const failed = fulfilled.length === 0 && results.every((result) => result.status === "rejected");

  const merged = fulfilled
    .flatMap((result) => result.value)
    .sort((a, b) => {
      const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 3);

  return { items: merged, failed };
}

export default async function HomePage() {
  const { items, failed } = await getTeaserItems();

  return (
    <>
      <Hero />
      <ContentTeaser items={items} failed={failed} />
      <QuickLinks />
    </>
  );
}
