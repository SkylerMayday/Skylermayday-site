"use client";

import { useState } from "react";
import Image from "next/image";
import type { ContentItem } from "@/lib/content-types";
import Placeholder from "@/components/ui/Placeholder";
import Badge from "@/components/ui/Badge";

const PLATFORM_LABELS: Record<ContentItem["platform"], string> = {
  "twitch-clip": "Twitch Clip",
  "twitch-vod": "Twitch VOD",
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
};

function formatViewCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K views`;
  return `${count} views`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface ContentCardProps {
  item: ContentItem;
}

export default function ContentCard({ item }: ContentCardProps) {
  const [imageError, setImageError] = useState(false);
  const showPlaceholder = !item.thumbnailUrl || imageError;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      // border -> --brand + 2px lift on hover, no soft shadow (design-brief.md
      // §5.5; §4.6 motion spec: 160ms ease-out).
      className="group flex flex-col overflow-hidden rounded-lg border border-border transition-[border-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-brand motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-video w-full bg-surface">
        {showPlaceholder ? (
          <Placeholder className="h-full w-full" label={item.title} />
        ) : (
          <Image
            src={item.thumbnailUrl as string}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            onError={() => setImageError(true)}
          />
        )}
        <span className="absolute left-2 top-2">
          <Badge variant="info">{PLATFORM_LABELS[item.platform]}</Badge>
        </span>
        {item.durationSec !== null && (
          // Same theme-independent scrim logic as Badge's `info` variant
          // (literal dark --bg hex, not the toggling token) — this chip
          // sits on thumbnail imagery, not the page background.
          //
          // THIS IS --accent's ONE HOME IN THE SITE UI (design-brief.md
          // RISK 3 / §4.7 item (a) — the Gen VII binder orange is one of the
          // four decisions the brief names as carrying the system's whole
          // distinctiveness, and the first pass shipped it defined,
          // documented, exposed as a utility, and consumed zero times
          // outside the OG image).
          // Why here specifically: §4.3 scopes --accent to "live/hype
          // signals" on "dark planes only", and a real clip/VOD runtime is
          // the closest thing this site has to a live signal — it is
          // genuine content metadata, never invented decoration, which is
          // what SAFE 4 requires. The chip is also the only permanently
          // dark carrier outside the hero, so the accent is legible here in
          // BOTH themes without needing --accent-strong's light-mode form.
          // Deliberately not spread further: one verified home, per the
          // brief's "purple is the room, orange is the moment" framing.
          // Measured: #F2941C on the composited chip is 8.36:1 over a black
          // thumbnail and 5.55:1 in the worst case (85% #0F0B16 over a pure
          // white thumbnail = rgb(51,48,57)) — AA-normal at every point in
          // that range, not just the nominal one.
          <span className="absolute bottom-2 right-2 rounded bg-[#0F0B16]/85 px-1.5 py-0.5 text-xs font-medium text-accent">
            {formatDuration(item.durationSec)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {/* H3 per design-brief.md §4.4's card-title row: 20/22px at 700.
            Was text-sm/600 — wrong on both counts (600 is outside anti-goal
            9's {400,500,700,900} cap). */}
        <h3 className="line-clamp-2 text-[20px] leading-[1.25] font-bold tracking-[-0.01em] text-fg group-hover:underline sm:text-[22px]">
          {item.title}
        </h3>
        {item.viewCount !== null && (
          <p className="text-xs text-fg-muted">{formatViewCount(item.viewCount)}</p>
        )}
      </div>
    </a>
  );
}
