"use client";

import { useState } from "react";
import { AiCard } from "./AiCard";
import { descriptionPrompt } from "@/lib/stream-analyser/ai-prompts";
import { callClaude, parseClaudeJson } from "@/lib/stream-analyser/title-rating";
import { fmtDurShort, nFmt } from "@/lib/stream-analyser/format";
import type { AiCardState, ChannelData, Discoverability, DescriptionAnalysis, ScheduleModel } from "@/lib/stream-analyser/types";

interface ChannelOverviewProps {
  channel: ChannelData;
  discoverability: AiCardState<Discoverability>;
  onRunDiscoverability: () => void;
  /**
   * computeScheduleConsistency(vods) result, fed from StreamAnalyser (§5
   * step 2 says the overview renders a schedule card; the schedule model
   * itself is derived from the VOD list already fetched at that step, not
   * refetched here — see specs.md §4 schedule.ts note).
   */
  schedule: ScheduleModel | null;
}

/** Channel overview cards: avatar/followers, schedule consistency, description analysis (on-demand),
 * discoverability (auto-run), and a static community-protection advice card. No subs/bits anywhere. */
export function ChannelOverview({ channel, discoverability, onRunDiscoverability, schedule }: ChannelOverviewProps) {
  const [descState, setDescState] = useState<AiCardState<DescriptionAnalysis>>({ status: "idle" });

  async function analyseDescription() {
    if (!channel.description) return;
    setDescState({ status: "loading" });
    try {
      const spec = descriptionPrompt(channel.description);
      const raw = await callClaude(spec.system, spec.user, spec.maxTokens);
      const data = parseClaudeJson<DescriptionAnalysis>(raw);
      setDescState({ status: "ok", data });
    } catch (err) {
      setDescState({ status: "error", message: (err as Error).message });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        {channel.profileImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={channel.profileImageUrl} alt="" width={56} height={56} className="rounded-full" />
        )}
        <div className="flex flex-col">
          <span className="text-lg font-semibold">{channel.displayName}</span>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {nFmt(channel.followers)} followers · {channel.category || "no category set"}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h3 className="mb-2 text-sm font-semibold">Schedule consistency</h3>
        {schedule ? (
          <div className="flex flex-col gap-1 text-sm text-neutral-600 dark:text-neutral-300">
            <span>{schedule.consistencyPct}% of streams land on your top-2 days.</span>
            <span>Most common start window: {schedule.peakLabel}.</span>
            <span>Average stream length: {fmtDurShort(schedule.avgDurSec)}.</span>
            {schedule.medianGapDays !== null && <span>Median gap between streams: {schedule.medianGapDays} days.</span>}
          </div>
        ) : (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Not enough VODs to compute a schedule pattern (need at least 3).</p>
        )}
      </div>

      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h3 className="mb-2 text-sm font-semibold">Channel description</h3>
        <p className="mb-3 whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-300">
          {channel.description || "(no description set)"}
        </p>
        {channel.description && descState.status === "idle" && (
          <button
            type="button"
            onClick={analyseDescription}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium dark:border-neutral-700"
          >
            Analyse description
          </button>
        )}
        <AiCard
          state={descState}
          loadingLabel="Analysing description…"
          render={(data) => (
            <div className="flex flex-col gap-2 text-sm">
              <span className="font-medium">{data.score}/10 — {data.verdict}</span>
              {data.rewrite && (
                <div className="rounded-md border border-neutral-200 p-2 text-xs dark:border-neutral-800">
                  Suggested rewrite: {data.rewrite}
                </div>
              )}
            </div>
          )}
        />
      </div>

      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Discoverability</h3>
          {discoverability.status === "idle" && (
            <button
              type="button"
              onClick={onRunDiscoverability}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium dark:border-neutral-700"
            >
              Run audit
            </button>
          )}
        </div>
        <AiCard
          state={discoverability}
          loadingLabel="Auditing discoverability…"
          render={(data) => (
            <div className="flex flex-col gap-2 text-sm">
              <span className="font-medium">{data.score}/10 — {data.verdict}</span>
              {data.wins.length > 0 && (
                <ul className="list-disc pl-5 text-xs text-green-700 dark:text-green-400">
                  {data.wins.map((w) => <li key={w}>{w}</li>)}
                </ul>
              )}
              {data.issues.length > 0 && (
                <ul className="list-disc pl-5 text-xs text-amber-700 dark:text-amber-400">
                  {data.issues.map((i) => <li key={i}>{i}</li>)}
                </ul>
              )}
              {data.actions.length > 0 && (
                <ul className="list-disc pl-5 text-xs">
                  {data.actions.map((a) => <li key={a}>{a}</li>)}
                </ul>
              )}
            </div>
          )}
        />
      </div>

      {/* Static advice card — not AI-driven in the old app (specs.md §4 / §8 flag #2). */}
      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h3 className="mb-2 text-sm font-semibold">Community protection</h3>
        <ul className="list-disc pl-5 text-sm text-neutral-600 dark:text-neutral-300">
          <li>Enable follower-only or sub-only chat mode during raids or brigading attempts.</li>
          <li>Set up AutoMod and a banned-terms list before you go live, not after an incident starts.</li>
          <li>Appoint trusted mods with clear escalation steps (timeout → ban → panic button).</li>
          <li>Review Twitch&apos;s Safety Center tools (Shield Mode, suspicious user detection) periodically — they change over time.</li>
        </ul>
      </div>
    </div>
  );
}
