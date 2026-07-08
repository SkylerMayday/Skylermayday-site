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
      className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 transition hover:shadow-md dark:border-neutral-800"
    >
      <div className="relative aspect-video w-full bg-neutral-100 dark:bg-neutral-900">
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
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
            {formatDuration(item.durationSec)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-neutral-900 group-hover:underline dark:text-neutral-100">
          {item.title}
        </h3>
        {item.viewCount !== null && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {formatViewCount(item.viewCount)}
          </p>
        )}
      </div>
    </a>
  );
}
