/**
 * Chat-based clip scoring — ported from StreamAnalyser/public/index.html
 * (scoreClips :3670-3727, scoreAudioClips :3748-3799, dedupClips :3804-3831,
 * clipReason :3730-3741). Logic and thresholds are unchanged; only the
 * `audioMoments` param on scoreClips is dropped (unused by the caller — see
 * specs.md §4 function-signature note) and types are added.
 */

import type { AudioClip, ChatClip, ChatComment } from "./types";

// Regexes copied verbatim from index.html:3666-3668.
export const HYPE_KEYWORDS =
  /\b(pog|poggers|lol|lmao|lmfao|rofl|omg|wtf|holy|insane|clutch|nice|gg|wp|hype|W|cracked|clean|nuts|no way|let'?s go|lets go|goated|goat|sick|sheesh|based|actual|literally|bro|wait what)\b/i;
export const LAUGH_EMOJIS = /[😂🤣😭💀]|KEKW|LULW|OMEGALUL|PepeLaugh|LUL|KEK/g;
export const HYPE_EMOTES = /PogChamp|Pog|POGGERS|WAYTOODANK|PepegaCredit|EZ|EZY|W\s*$|Clap|PogU/g;

/** Ported from index.html:3670-3727. */
export function scoreClips(comments: ChatComment[], duration: number): ChatClip[] {
  if (!comments.length) return [];
  const windowSec = 30;
  const hopSec = 10;
  const sorted = [...comments].sort((a, b) => a.t - b.t);

  const binSec = 5;
  const nBins = Math.ceil(duration / binSec);
  const bins = new Array(nBins).fill(0);
  sorted.forEach((c) => {
    const i = Math.floor(c.t / binSec);
    if (i >= 0 && i < nBins) bins[i]++;
  });
  const mean = bins.reduce((a, b) => a + b, 0) / bins.length || 1;
  const sd = Math.sqrt(bins.reduce((a, b) => a + (b - mean) ** 2, 0) / bins.length) || 1;

  const windows: ChatClip[] = [];
  for (let start = 0; start + windowSec <= duration; start += hopSec) {
    const end = start + windowSec;
    const winMsgs = sorted.filter((c) => c.t >= start && c.t < end);
    if (!winMsgs.length) continue;

    const startBin = Math.floor(start / binSec);
    const endBin = Math.floor(end / binSec);
    const winBinSum = bins.slice(startBin, endBin).reduce((a, b) => a + b, 0);
    const binsInWin = Math.max(1, endBin - startBin);
    const z = (winBinSum / binsInWin - mean) / sd;

    let laughs = 0;
    let hype = 0;
    let hypeEmotes = 0;
    winMsgs.forEach((m) => {
      const msg = m.msg || "";
      const laughMatches = msg.match(LAUGH_EMOJIS);
      if (laughMatches) laughs += laughMatches.length;
      if (HYPE_KEYWORDS.test(msg)) hype++;
      const emoteMatches = msg.match(HYPE_EMOTES);
      if (emoteMatches) hypeEmotes += emoteMatches.length;
    });

    const uniqueUsers = new Set(winMsgs.map((m) => m.user)).size;
    const velocityScore = Math.max(0, z) * 1.0;
    const excitementScore =
      (laughs * 0.35 + hype * 0.45 + hypeEmotes * 0.4 + uniqueUsers * 0.15) / windowSec;
    const score = velocityScore + excitementScore * 2.5;

    windows.push({
      start,
      end,
      score,
      z,
      laughs,
      hype,
      hypeEmotes,
      unique: uniqueUsers,
      msgCount: winMsgs.length,
      sample: winMsgs.slice(0, 12),
    });
  }

  windows.sort((a, b) => b.score - a.score);
  const picked: ChatClip[] = [];
  for (const w of windows) {
    if (picked.some((p) => !(w.end < p.start - 20 || w.start > p.end + 20))) continue;
    picked.push(w);
    if (picked.length >= 12) break;
  }
  picked.sort((a, b) => b.score - a.score);
  return picked;
}

/** Ported from index.html:3730-3741 (audioBoost/audioMoments fields dropped — see pipeline note in specs.md §4). */
export function clipReason(c: ChatClip): string {
  const parts: string[] = [];
  if (c.z > 2) parts.push(`chat velocity spiked <strong>${c.z.toFixed(1)}σ</strong> above baseline`);
  else if (c.z > 1) parts.push(`chat activity up <strong>${c.z.toFixed(1)}σ</strong>`);
  if (c.laughs > 5) parts.push(`${c.laughs} laugh reactions`);
  if (c.hypeEmotes > 3) parts.push(`${c.hypeEmotes} hype emotes (PogU / EZ / Clap)`);
  if (c.hype > 5) parts.push(`${c.hype} hype keywords (W / insane / clutch)`);
  if (c.unique > 15) parts.push(`<strong>${c.unique}</strong> unique commenters reacting`);
  if (!parts.length) parts.push(`${c.msgCount} messages in window`);
  return parts.join(" · ");
}

/** Ported from index.html:3748-3799. Kept exported for tests, though the
 * pipeline builds audio clips from AudioMoment[] directly (see specs.md §4). */
export function scoreAudioClips(
  energyCurve: { t: number; rms: number }[],
  duration: number
): AudioClip[] {
  if (!energyCurve || energyCurve.length < 3) return [];
  const windowSec = 30;

  const sorted = [...energyCurve.map((p) => p.rms)].sort((a, b) => a - b);
  const p95idx = Math.floor(sorted.length * 0.95);
  const p95 = sorted[p95idx] || sorted[sorted.length - 1] || 1e-6;
  const normCurve = energyCurve.map((p) => ({ t: p.t, rms: p.rms / p95 }));

  function normRmsInWindow(start: number, end: number): number {
    const pts = normCurve.filter((p) => p.t >= start && p.t < end);
    if (!pts.length) return 0;
    return pts.reduce((a, p) => a + p.rms, 0) / pts.length;
  }

  const normValues = normCurve.map((p) => p.rms);
  const mean = normValues.reduce((a, b) => a + b, 0) / normValues.length;
  const sd = Math.sqrt(normValues.reduce((a, b) => a + (b - mean) ** 2, 0) / normValues.length) || 1;

  const candidates: AudioClip[] = [];
  normCurve.forEach((pt) => {
    const start = Math.max(0, pt.t - windowSec / 2);
    const end = Math.min(duration, start + windowSec);
    const avgNormRms = normRmsInWindow(start, end);
    const z = (avgNormRms - mean) / sd;
    if (z > 0.5) {
      candidates.push({ start, end, score: z, z, rms: avgNormRms });
    }
  });

  candidates.sort((a, b) => b.score - a.score);
  const picked: AudioClip[] = [];
  for (const w of candidates) {
    if (picked.some((p) => !(w.end < p.start - 20 || w.start > p.end + 20))) continue;
    picked.push(w);
    if (picked.length >= 20) break;
  }
  picked.sort((a, b) => b.score - a.score);
  return picked;
}

/** Ported from index.html:3804-3831. */
export function dedupClips(
  audioClips: AudioClip[],
  chatClips: ChatClip[]
): { audioClips: AudioClip[]; chatClips: ChatClip[] } {
  const OVERLAP_SEC = 45;
  function overlaps(a: { start: number }, b: { start: number }): boolean {
    return Math.abs(a.start - b.start) < OVERLAP_SEC;
  }

  const usedAudio: AudioClip[] = [];
  const allAudioSorted = [...audioClips];

  for (const ac of allAudioSorted) {
    const clashesChat = chatClips.some((cc) => overlaps(ac, cc));
    const clashesAudio = usedAudio.some((ua) => overlaps(ac, ua));
    if (!clashesChat && !clashesAudio) {
      usedAudio.push(ac);
    }
    if (usedAudio.length >= 15) break;
  }

  const usedChat: ChatClip[] = [];
  for (const cc of chatClips) {
    if (!usedChat.some((uc) => overlaps(cc, uc))) {
      usedChat.push(cc);
    }
    if (usedChat.length >= 15) break;
  }

  return { audioClips: usedAudio, chatClips: usedChat };
}
