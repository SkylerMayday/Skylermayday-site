/**
 * Ported from StreamAnalyser/public/index.html:5578-5628
 * (computeScheduleConsistency). Pure function, fed by the already-fetched
 * `fetchChannelVods` result — no extra network call, per specs.md §4.
 */

import type { ScheduleModel, VodSummary } from "./types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MIN_STREAMS_REQUIRED = 3;

export function computeScheduleConsistency(vods: VodSummary[]): ScheduleModel | null {
  const streams = vods
    .filter((v) => (v.broadcastType || "").toUpperCase() === "ARCHIVE" || !v.broadcastType)
    .map((v) => ({ date: new Date(v.createdAt), dur: v.lengthSeconds || 0 }))
    .filter((v) => !isNaN(v.date.getTime()));

  if (streams.length < MIN_STREAMS_REQUIRED) return null;

  const dayCounts = new Array(7).fill(0);
  const hourCounts = new Array(24).fill(0);
  const weekdaySet = new Set<number>();
  streams.forEach((s) => {
    dayCounts[s.date.getDay()]++;
    hourCounts[s.date.getHours()]++;
    weekdaySet.add(s.date.getDay());
  });

  const sorted = [...dayCounts].sort((a, b) => b - a);
  const top2 = sorted[0] + (sorted[1] || 0);
  const consistencyPct = streams.length > 0 ? Math.round((top2 / streams.length) * 100) : 0;

  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakLabel = `${String(peakHour).padStart(2, "0")}:00–${String(peakHour + 2).padStart(2, "0")}:00`;

  const avgDurSec = streams.reduce((a, b) => a + b.dur, 0) / streams.length;

  const sortedDates = [...streams].sort((a, b) => a.date.getTime() - b.date.getTime()).map((s) => s.date);
  const gaps: number[] = [];
  for (let i = 1; i < sortedDates.length; i++) {
    gaps.push((sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 86400));
  }
  const medianGap = gaps.length ? gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)] : null;

  return {
    totalStreams: streams.length,
    dayCounts,
    dayNames: DAY_NAMES,
    consistencyPct,
    peakLabel,
    avgDurSec,
    medianGapDays: medianGap ? Math.round(medianGap * 10) / 10 : null,
    weekdays: [...weekdaySet],
  };
}
