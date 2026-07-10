/**
 * Audio analysis functions ported UNCHANGED from
 * StreamAnalyser/public/lib/audio-probe.js — detectAudioMoments :43-87,
 * computeLoudnessStats :99-150, detectEcho :285-320. Only change: TS types
 * and removing the `window.` globals (client component, operates on
 * decoded AudioBuffer instances from the Web Audio API).
 */

import type { AudioMoment, DecodedSegment, LoudnessStats } from "./types";

/** Ported from audio-probe.js:43-87. */
export function detectAudioMoments(decoded: DecodedSegment[]): AudioMoment[] {
  if (!decoded || !decoded.length) return [];
  const moments: AudioMoment[] = [];
  decoded.forEach(({ offset, buffer }) => {
    const ch = buffer.getChannelData(0);
    const sr = buffer.sampleRate;
    const windowSec = 1.0;
    const windowSize = Math.floor(sr * windowSec);
    const hop = Math.floor(windowSize / 2);
    const energies: { tOffset: number; rms: number }[] = [];
    for (let i = 0; i + windowSize <= ch.length; i += hop) {
      let sum = 0;
      for (let j = 0; j < windowSize; j++) sum += ch[i + j] * ch[i + j];
      const rms = Math.sqrt(sum / windowSize);
      energies.push({ tOffset: i / sr, rms });
    }
    if (energies.length < 4) return;
    const mean = energies.reduce((a, b) => a + b.rms, 0) / energies.length;
    const sd = Math.sqrt(energies.reduce((a, b) => a + (b.rms - mean) ** 2, 0) / energies.length);
    if (sd < 1e-5) return;
    energies.forEach((e) => {
      const z = (e.rms - mean) / sd;
      if (z >= 2.0 && e.rms > 0.05) {
        moments.push({
          absoluteTime: offset + e.tOffset,
          rms: e.rms,
          zScore: z,
        });
      }
    });
  });

  moments.sort((a, b) => a.absoluteTime - b.absoluteTime);
  const deduped: AudioMoment[] = [];
  moments.forEach((m) => {
    if (!deduped.length || m.absoluteTime - deduped[deduped.length - 1].absoluteTime > 3) {
      deduped.push(m);
    } else if (m.zScore > deduped[deduped.length - 1].zScore) {
      deduped[deduped.length - 1] = m;
    }
  });
  return deduped;
}

/** Ported from audio-probe.js:99-150. */
export function computeLoudnessStats(decoded: DecodedSegment[]): LoudnessStats | null {
  if (!decoded || !decoded.length) return null;

  const CLIP_THRESHOLD = 0.99;
  const SILENCE_RMS = Math.pow(10, -50 / 20);

  let totalSamples = 0;
  let clippedSamples = 0;
  let peak = 0;
  let sumSquares = 0;
  let quietWindows = 0;
  let totalWindows = 0;

  decoded.forEach(({ buffer }) => {
    const ch = buffer.getChannelData(0);
    const sr = buffer.sampleRate;
    const winSize = Math.floor(sr * 1.0);

    for (let i = 0; i < ch.length; i++) {
      const s = ch[i];
      const abs = Math.abs(s);
      if (abs > peak) peak = abs;
      if (abs >= CLIP_THRESHOLD) clippedSamples++;
      sumSquares += s * s;
      totalSamples++;
    }

    for (let i = 0; i + winSize <= ch.length; i += winSize) {
      let wSum = 0;
      for (let j = 0; j < winSize; j++) wSum += ch[i + j] * ch[i + j];
      const wRms = Math.sqrt(wSum / winSize);
      if (wRms < SILENCE_RMS) quietWindows++;
      totalWindows++;
    }
  });

  if (!totalSamples) return null;

  const meanRms = Math.sqrt(sumSquares / totalSamples);
  const peakDbFS = peak > 0 ? 20 * Math.log10(peak) : -100;
  const meanDbFS = meanRms > 0 ? 20 * Math.log10(meanRms) : -100;
  const clippingPct = (clippedSamples / totalSamples) * 100;
  const quietPct = totalWindows ? (quietWindows / totalWindows) * 100 : 0;

  return { peakDbFS, meanDbFS, clippingPct, quietPct, samplesAnalysed: totalSamples };
}

/** Ported from audio-probe.js:285-320. */
export function detectEcho(
  samples: Float32Array,
  sampleRate: number
): { echo: boolean; confidence: number; lagMs: number } {
  const target = 8000;
  const ratio = sampleRate / target;
  const N = Math.floor(samples.length / ratio);
  const mono = new Float32Array(N);
  for (let i = 0; i < N; i++) mono[i] = samples[Math.floor(i * ratio)] || 0;

  let mean = 0;
  for (let i = 0; i < N; i++) mean += mono[i];
  mean /= N;
  for (let i = 0; i < N; i++) mono[i] -= mean;

  const minLag = Math.floor(0.05 * target);
  const maxLag = Math.floor(0.4 * target);
  let r0 = 0;
  for (let i = 0; i < N; i++) r0 += mono[i] * mono[i];
  if (r0 < 1e-6) return { echo: false, confidence: 0, lagMs: 0 };

  let bestLag = 0;
  let bestR = 0;
  for (let lag = minLag; lag <= maxLag; lag += 4) {
    let r = 0;
    const cap = N - lag;
    for (let i = 0; i < cap; i += 2) r += mono[i] * mono[i + lag];
    r /= r0;
    if (r > bestR) {
      bestR = r;
      bestLag = lag;
    }
  }

  const lagMs = (bestLag / target) * 1000;
  const echo = bestR > 0.35 && lagMs >= 50 && lagMs <= 400;
  return { echo, confidence: bestR, lagMs };
}
