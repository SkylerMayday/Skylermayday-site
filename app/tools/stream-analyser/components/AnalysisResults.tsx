"use client";

import { AiCard } from "./AiCard";
import { bitrateQuality } from "@/lib/stream-analyser/benchmark";
import type {
  AiCardState,
  BenchmarkModel,
  BitrateModel,
  FeedbackItem,
  StreamMetrics,
  TitleRating,
  VodMeta,
} from "@/lib/stream-analyser/types";

interface AnalysisResultsProps {
  meta: VodMeta;
  benchmark: BenchmarkModel;
  bitrate: BitrateModel | null;
  titleRating: AiCardState<TitleRating>;
  feedback: AiCardState<FeedbackItem[]>;
  metrics: AiCardState<StreamMetrics>;
}

const STATUS_COLOR: Record<string, string> = {
  ok: "text-green-700 dark:text-green-400",
  warn: "text-amber-700 dark:text-amber-400",
  bad: "text-red-700 dark:text-red-400",
  dim: "text-neutral-400 dark:text-neutral-500",
  info: "text-neutral-500 dark:text-neutral-400",
};

const TAG_LABEL: Record<FeedbackItem["tag"], string> = {
  good: "OK",
  bad: "ISSUE",
  warn: "NOTE",
  info: "INFO",
};

export function AnalysisResults({ meta, benchmark, bitrate, titleRating, feedback, metrics }: AnalysisResultsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="mb-1 text-lg font-semibold">{meta.title}</h2>
        {meta.twitchClipCount !== null && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {meta.twitchClipCount} viewer clip{meta.twitchClipCount !== 1 ? "s" : ""} made from this VOD.
          </p>
        )}
      </div>

      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h3 className="mb-3 text-sm font-semibold">Your stream vs. typical ranges</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                <th className="py-2 pr-3">Metric</th>
                <th className="py-2 pr-3">Typical range</th>
                <th className="py-2 text-right">Your stream</th>
              </tr>
            </thead>
            <tbody>
              {benchmark.rows.map((row) => (
                <tr key={row.label} className="border-b border-neutral-100 dark:border-neutral-900">
                  <td className="py-2 pr-3">{row.label}</td>
                  <td className="py-2 pr-3 text-neutral-500 dark:text-neutral-400" title={row.note}>
                    {row.ranges}
                  </td>
                  <td className={`py-2 text-right font-mono ${STATUS_COLOR[row.status]}`}>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {bitrate && (
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <h3 className="mb-1 text-sm font-semibold">Stream quality &amp; bitrate</h3>
          <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">{bitrate.sourceNote}</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] border-collapse text-sm">
              <tbody>
                {bitrate.variants.map((v) => {
                  const quality = bitrateQuality(v.bw);
                  return (
                    <tr key={v.uri} className="border-b border-neutral-100 dark:border-neutral-900">
                      <td className="py-2 pr-3">{v.name || v.res || "—"}</td>
                      <td className="py-2 pr-3 font-mono">{(v.bw / 1_000_000).toFixed(2)} Mbps</td>
                      <td className={`py-2 text-xs font-semibold uppercase ${STATUS_COLOR[quality === "good" ? "ok" : quality === "mid" ? "dim" : "warn"]}`}>
                        {quality}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h3 className="mb-3 text-sm font-semibold">Rate your title</h3>
        <AiCard
          state={titleRating}
          loadingLabel="Rating title…"
          render={(data) => (
            <div className="flex flex-col gap-2 text-sm">
              <span className="font-medium">{data.score}/10 — {data.verdict}</span>
              {data.strengths.length > 0 && (
                <ul className="list-disc pl-5 text-xs text-green-700 dark:text-green-400">
                  {data.strengths.map((s) => <li key={s}>{s}</li>)}
                </ul>
              )}
              {data.weaknesses.length > 0 && (
                <ul className="list-disc pl-5 text-xs text-red-700 dark:text-red-400">
                  {data.weaknesses.map((w) => <li key={w}>{w}</li>)}
                </ul>
              )}
              {data.alternatives.length > 0 && (
                <div className="flex flex-col gap-1 text-xs">
                  <span className="font-medium">Alternatives</span>
                  {data.alternatives.map((a) => <div key={a}>{a}</div>)}
                </div>
              )}
            </div>
          )}
        />
      </div>

      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h3 className="mb-3 text-sm font-semibold">Stream score</h3>
        <AiCard
          state={metrics}
          loadingLabel="Scoring stream…"
          render={(data) => (
            <div className="flex flex-col gap-2 text-sm">
              <span className="font-medium">{data.overall}/10 — {data.verdict}</span>
              {data.dimensions.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="min-w-[140px]">{d.name}</span>
                  <span className="font-mono">{d.score}/10</span>
                  <span className="text-neutral-500 dark:text-neutral-400">{d.note}</span>
                </div>
              ))}
            </div>
          )}
        />
      </div>

      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h3 className="mb-3 text-sm font-semibold">Feedback</h3>
        <AiCard
          state={feedback}
          loadingLabel="Enhancing feedback with AI…"
          render={(items) => (
            <ul className="flex flex-col gap-2 text-sm">
              {items.map((item, i) => (
                 
                <li key={i} className="flex gap-2">
                  <span className={`shrink-0 font-mono text-xs font-bold ${STATUS_COLOR[item.tag === "good" ? "ok" : item.tag]}`}>
                    {TAG_LABEL[item.tag]}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: item.body }} />
                </li>
              ))}
            </ul>
          )}
        />
      </div>
    </div>
  );
}
