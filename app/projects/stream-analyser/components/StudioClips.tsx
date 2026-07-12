"use client";

import { clipReason } from "@/lib/stream-analyser/chat-clip-detection";
import { fmtDur } from "@/lib/stream-analyser/format";
import type { AudioClip, AudioProbeResult, ChatClip } from "@/lib/stream-analyser/types";

interface StudioClipsProps {
  chatClips: ChatClip[];
  audioClips: AudioClip[];
  audioProbe: AudioProbeResult | null;
  vodId: string;
}

function twitchDeepLink(vodId: string, start: number): string {
  const s = Math.floor(start);
  return `https://www.twitch.tv/videos/${vodId}?t=${Math.floor(s / 3600)}h${Math.floor((s % 3600) / 60)}m${s % 60}s`;
}

/** Side-by-side chat clip / audio clip lists, each row deep-linking to the VOD timestamp. */
export function StudioClips({ chatClips, audioClips, audioProbe, vodId }: StudioClipsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Chat-driven clips</h3>
        {chatClips.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No moments found for this section.</p>
        ) : (
          chatClips.map((c, i) => (
            <div key={`${c.start}-${i}`} className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
              <div className="flex items-center justify-between text-sm">
                <span className="font-mono">{fmtDur(c.start)}</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">score {c.score.toFixed(2)}</span>
              </div>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300" dangerouslySetInnerHTML={{ __html: clipReason(c) }} />
              <a
                href={twitchDeepLink(vodId, c.start)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-medium text-blue-600 dark:text-blue-400"
              >
                Open at {fmtDur(c.start)} ▸
              </a>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Audio-peak clips</h3>
        {audioProbe?.blocked ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{audioProbe.reason}</p>
        ) : audioClips.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No moments found for this section.</p>
        ) : (
          audioClips.map((c, i) => (
            <div key={`${c.start}-${i}`} className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
              <div className="flex items-center justify-between text-sm">
                <span className="font-mono">{fmtDur(c.start)}</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">z {c.z.toFixed(2)}</span>
              </div>
              <a
                href={twitchDeepLink(vodId, c.start)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-medium text-blue-600 dark:text-blue-400"
              >
                Open at {fmtDur(c.start)} ▸
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
