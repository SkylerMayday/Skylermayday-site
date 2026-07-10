"use client";

import { fmtDurShort, nFmt } from "@/lib/stream-analyser/format";
import type { VodSummary } from "@/lib/stream-analyser/types";

interface VodPickerProps {
  vods: VodSummary[];
  onSelect: (vodId: string) => void;
  disabled: boolean;
}

/** Grid of VOD tiles. Ported logic from index.html:3458-3508 (renderVodPicker). */
export function VodPicker({ vods, onSelect, disabled }: VodPickerProps) {
  if (!vods.length) {
    return (
      <div className="rounded-md border border-dashed border-neutral-300 p-6 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
        No archived VODs found — check the name or that &quot;Store past broadcasts&quot; is enabled.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {vods.map((v) => {
        const bType = (v.broadcastType || "").toUpperCase();
        const isArchive = bType === "ARCHIVE" || bType === "";
        const typeLabel = bType === "HIGHLIGHT" ? "HIGHLIGHT" : bType === "UPLOAD" ? "UPLOAD" : null;
        const thumb = v.previewThumbnailURL
          .replace("%{width}", "400")
          .replace("%{height}", "225")
          .replace("{width}", "400")
          .replace("{height}", "225");
        const dateStr = v.createdAt
          ? new Date(v.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
          : "";

        return (
          <button
            key={v.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(v.id)}
            className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 text-left transition hover:shadow-md disabled:opacity-50 dark:border-neutral-800"
          >
            <div className="relative aspect-video bg-neutral-100 dark:bg-neutral-800">
              {thumb && !thumb.includes("404_processing") && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt="" className="h-full w-full object-cover" />
              )}
              <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[10px] text-white">
                {fmtDurShort(v.lengthSeconds)}
              </span>
              {typeLabel && (
                <span className="absolute left-1 top-1 rounded bg-amber-900/90 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-white">
                  {typeLabel}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1 p-3">
              <div className="line-clamp-2 text-sm font-medium">{v.title || "(untitled)"}</div>
              <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>{dateStr}</span>
                <span>{nFmt(v.viewCount)} views</span>
              </div>
              {!isArchive && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400">Chat replay limited</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
