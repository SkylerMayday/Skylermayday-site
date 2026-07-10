/**
 * Pure port of renderBenchmarkCard (index.html:3847-3999) → returns a data
 * model (BenchmarkModel.rows[]) instead of an HTML string, and
 * buildBitrateModel, a pure port of the master-playlist bitrate parse/label
 * logic (index.html:5741-5807 minus the HTML rendering).
 *
 * All threshold functions and the `ranges`/`note` strings are copied
 * verbatim per specs.md §0 / §4.
 */

import type { BenchmarkModel, BenchmarkRow, BitrateModel, ChatClip, ChatComment, VodMeta } from "./types";

function nFmt(n: number): string {
  return n.toLocaleString("en-US");
}

function cpmStatus(v: number): BenchmarkRow["status"] {
  if (v < 1) return "bad";
  if (v < 3) return "warn";
  if (v >= 5) return "ok";
  return "dim";
}
function deadStatus(v: number): BenchmarkRow["status"] {
  if (v > 50) return "bad";
  if (v > 25) return "warn";
  if (v < 15) return "ok";
  return "dim";
}
function uniqueRatioStatus(v: number): BenchmarkRow["status"] {
  if (v < 0.25) return "warn";
  if (v >= 0.45) return "ok";
  return "dim";
}
function peakStatus(v: number): BenchmarkRow["status"] {
  if (v < 2) return "warn";
  if (v > 12) return "warn";
  if (v >= 3 && v <= 8) return "ok";
  return "dim";
}
function subPctStatus(v: number): BenchmarkRow["status"] {
  if (v >= 30) return "ok";
  if (v >= 10) return "dim";
  return "warn";
}
function coldOpenStatus(v: number): BenchmarkRow["status"] {
  if (v >= 3) return "ok";
  if (v >= 1) return "dim";
  return "warn";
}
function pacingStatus(v: number): BenchmarkRow["status"] {
  if (v <= 5) return "ok";
  if (v <= 15) return "dim";
  return "warn";
}

/** Ported from index.html:3847-3999 (renderBenchmarkCard). */
export function buildBenchmark(
  meta: VodMeta,
  comments: ChatComment[],
  clips: ChatClip[]
): BenchmarkModel {
  const dur = meta.duration;
  const cpm = dur > 0 ? comments.length / (dur / 60) : 0;

  const binSec = 60;
  const nBins = Math.ceil(dur / binSec);
  const bins = new Array(nBins).fill(0);
  comments.forEach((c) => {
    const i = Math.floor(c.t / binSec);
    if (i >= 0 && i < nBins) bins[i]++;
  });
  const deadPct = nBins > 0 ? (bins.filter((b) => b < 2).length / nBins) * 100 : 0;

  const unique = new Set(comments.map((c) => c.user)).size;
  const uniqueRatio = comments.length > 0 ? unique / comments.length : 0;

  const mean = bins.reduce((a, b) => a + b, 0) / (nBins || 1);
  const peak = Math.max(...bins, 0);
  const peakMeanRatio = mean > 0 ? peak / mean : 0;

  const subMsgs = comments.filter((c) => c.isSubscriber).length;
  const modMsgs = comments.filter((c) => c.isMod).length;
  const vipMsgs = comments.filter((c) => c.isVIP).length;
  const subPct = comments.length > 0 ? (subMsgs / comments.length) * 100 : 0;

  const coldOpen = comments.filter((c) => c.t < 300);
  const coldCpm = coldOpen.length / 5;

  const outroStart = Math.max(0, dur - 300);
  const outro = comments.filter((c) => c.t >= outroStart);
  const outroCpm = outro.length / 5;

  let maxDeadRun = 0;
  let curRun = 0;
  bins.forEach((b) => {
    if (b < 2) {
      curRun++;
      maxDeadRun = Math.max(maxDeadRun, curRun);
    } else curRun = 0;
  });

  const twitchClipCount = meta.twitchClipCount ?? null;

  const rows: BenchmarkRow[] = [
    {
      label: "Chat velocity",
      value: cpm.toFixed(1) + " msg/min",
      status: cpmStatus(cpm),
      ranges: "< 1 quiet · 1–3 emerging · 3–10 active · 10+ engaged",
      note: "Median for sub-500 CCV channels: 2–4 msg/min. Top 10% of small streamers: 8+.",
    },
    {
      label: "Dead-air minutes",
      value: deadPct.toFixed(0) + "%",
      status: deadStatus(deadPct),
      ranges: "< 15% excellent · 15–25% normal · 25–50% notable · 50%+ problematic",
      note: "Minutes with < 2 messages. VOD retention drops sharply through quiet stretches.",
    },
    {
      label: "Longest dead stretch",
      value: maxDeadRun + " min",
      status: pacingStatus(maxDeadRun),
      ranges: "≤ 5 min fine · 6–15 notable · 15+ problematic",
      note: "Longest consecutive run of near-silent minutes. Even one 20-min lull can bleed casual viewers.",
    },
    {
      label: "Cold open (first 5 min)",
      value: coldCpm.toFixed(1) + " msg/min",
      status: coldOpenStatus(coldCpm),
      ranges: "< 1 weak · 1–3 average · 3+ strong",
      note: "First impression matters most for VOD retention. Low cold-open chat usually means the stream started slowly.",
    },
    {
      label: "Outro (last 5 min)",
      value: outroCpm.toFixed(1) + " msg/min",
      status: coldOpenStatus(outroCpm),
      ranges: "< 1 weak · 1–3 average · 3+ strong",
      note: "A strong outro keeps viewers around for the raid and leaves a good final impression.",
    },
    {
      label: "Subscriber chat share",
      value: subPct.toFixed(0) + "% of msgs",
      status: subPctStatus(subPct),
      ranges: "< 10% low · 10–30% typical · 30%+ loyal community",
      note: `${nFmt(subMsgs)} sub msgs · ${nFmt(modMsgs)} mod · ${nFmt(vipMsgs)} VIP. High sub share means your community is invested.`,
    },
    {
      label: "Unique / total chatters",
      value: (uniqueRatio * 100).toFixed(0) + "%",
      status: uniqueRatioStatus(uniqueRatio),
      ranges: "< 25% spammy/bot-heavy · 25–45% typical · 45%+ organic",
      note: "Low ratio suggests a few users dominating chat or bot activity.",
    },
    {
      label: "Chat spike ratio",
      value: peakMeanRatio.toFixed(1) + "× peak/mean",
      status: peakStatus(peakMeanRatio),
      ranges: "< 2× flat · 3–8× healthy variation · > 12× one-event stream",
      note: "Healthy streams have recurring spikes (moments). A single huge spike with flat elsewhere means one viral moment and little else.",
    },
    {
      label: "Clip-worthy moments",
      value: clips.length + " found",
      status: clips.length >= 5 ? "ok" : clips.length >= 2 ? "dim" : "warn",
      ranges: "0–1 sparse · 2–4 moderate · 5+ rich",
      note: "Based on chat velocity + hype keyword scoring. Rough proxy — audio peaks included when proxy is active.",
    },
  ];

  if (twitchClipCount !== null) {
    rows.push({
      label: "Clips made by viewers",
      value: twitchClipCount + " clip" + (twitchClipCount !== 1 ? "s" : ""),
      status: twitchClipCount >= 5 ? "ok" : twitchClipCount >= 1 ? "dim" : "warn",
      ranges: "0 none · 1–4 some · 5+ viral potential",
      note: "Clips created by viewers during this VOD via Twitch's clip button. High clip rate = moments that resonated.",
    });
  }

  return { rows };
}

/** Pure port of the bitrate parse logic in index.html:5741-5807 (data only, no HTML). */
export function buildBitrateModel(masterPlaylistText: string): BitrateModel | null {
  const lines = masterPlaylistText.split("\n");
  const variants: { bw: number; res: string; name: string; uri: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXT-X-STREAM-INF")) {
      const info = lines[i];
      const uri = (lines[i + 1] || "").trim();
      const bw = +((info.match(/BANDWIDTH=(\d+)/) || [])[1] || 0);
      const res = (info.match(/RESOLUTION=(\S+)/) || [])[1] || "";
      const name =
        (info.match(/VIDEO="([^"]+)"/) || [])[1] || (info.match(/NAME="([^"]+)"/) || [])[1] || "";
      if (bw) variants.push({ bw, res, name, uri });
    }
  }

  if (!variants.length) return null;
  variants.sort((a, b) => b.bw - a.bw);

  const source = variants[0];
  const sourceNote =
    source.bw >= 6_000_000
      ? "Source quality is excellent — Twitch is receiving a high-bitrate feed."
      : source.bw >= 3_000_000
        ? "Source bitrate is adequate but consider increasing your OBS bitrate if upload allows."
        : "Source bitrate is low — viewers on lower connections may see quality issues. Check your OBS encoding settings.";

  return { variants, sourceNote };
}

/** "good"/"mid"/"low" bitrate label per variant — index.html:5771 threshold, exposed for the UI. */
export function bitrateQuality(bw: number): "good" | "mid" | "low" {
  if (bw >= 6_000_000) return "good";
  if (bw >= 3_000_000) return "mid";
  return "low";
}
