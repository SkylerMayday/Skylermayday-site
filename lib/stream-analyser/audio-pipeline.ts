/**
 * Client-side audio-probe orchestrator. Adapted from
 * audio-probe.js:322-388 (analyzeAudio) for the new fragmented-MP4 pipeline:
 * instead of fetching raw MPEG-TS segments and transmuxing with mux.js, each
 * sampled segment is fetched as init+fragment bytes via the same-origin
 * audio-proxy route (which concatenates them into a valid fMP4 the browser
 * decodes natively), and decoded directly with AudioContext.decodeAudioData.
 * No mux.js, no 'unsafe-eval' — per specs.md §3.5 / DO NOT PORT list.
 */

import { detectEcho, computeLoudnessStats, detectAudioMoments } from "./audio-clip-detection";
import { getVodPlaybackToken, getVodPlaylistUrl, parseMasterPlaylist, parseMediaPlaylist } from "./twitch-gql";
import type { AudioProbeResult, DecodedSegment, EchoResult } from "./types";

const SAMPLE_COUNT = 15;

async function fetchPlaylistText(url: string): Promise<string> {
  const res = await fetch(`/api/stream-analyser/playlist-proxy?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`fetch failed ${res.status}`);
  return res.text();
}

async function fetchSegmentBytes(initUri: string, segUri: string): Promise<ArrayBuffer> {
  const url = `/api/stream-analyser/audio-proxy?init=${encodeURIComponent(initUri)}&seg=${encodeURIComponent(segUri)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed ${res.status}`);
  return res.arrayBuffer();
}

/**
 * Runs the full audio probe for a VOD: token → playlists → sample 15
 * segments (even stride) → fetch+decode each → echo detection per segment →
 * loudness stats + moment detection across all decoded buffers.
 */
export async function runAudioProbe(
  vodId: string,
  onProgress?: (pct: number, msg: string) => void
): Promise<AudioProbeResult> {
  const emptyResult = (reason: string): AudioProbeResult => ({
    blocked: true,
    reason,
    results: [],
    loudness: null,
    decodedBuffers: [],
  });

  let masterUrl: string;
  try {
    onProgress?.(0, "Requesting VOD playback token…");
    const token = await getVodPlaybackToken(vodId);
    masterUrl = getVodPlaylistUrl(token, vodId);
  } catch (e) {
    return emptyResult(`Could not get VOD playback token: ${(e as Error).message}`);
  }

  let master: string;
  try {
    onProgress?.(5, "Fetching HLS master playlist…");
    master = await fetchPlaylistText(masterUrl);
  } catch {
    return emptyResult("Twitch CDN blocked audio fetch. Browsers can't pull VOD audio without a proxy.");
  }

  const variants = parseMasterPlaylist(master);
  if (!variants.length) return emptyResult("No playable variants found.");
  variants.sort((a, b) => a.bandwidth - b.bandwidth);
  const variant = variants[0];

  let mediaPlaylistText: string;
  try {
    onProgress?.(10, `Fetching media playlist (${Math.round(variant.bandwidth / 1000)} kbps variant)…`);
    mediaPlaylistText = await fetchPlaylistText(variant.uri);
  } catch {
    return emptyResult("Media playlist fetch blocked.");
  }

  const { initUri, segments } = parseMediaPlaylist(mediaPlaylistText, variant.uri);
  if (!segments.length) return emptyResult("No segments in playlist.");
  if (!initUri) return emptyResult("No init segment (#EXT-X-MAP) found in media playlist.");

  const sampleCount = Math.min(SAMPLE_COUNT, segments.length);
  const stride = Math.max(1, Math.floor(segments.length / sampleCount));
  const sampled: { idx: number }[] = [];
  for (let i = 0; i < segments.length && sampled.length < sampleCount; i += stride) {
    sampled.push({ idx: i });
  }

  const AudioContextCtor =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioContextCtor();
  const results: EchoResult[] = [];
  const decodedBuffers: DecodedSegment[] = [];
  let decoded = 0;
  let decodeFails = 0;

  for (let si = 0; si < sampled.length; si++) {
    const { idx } = sampled[si];
    const seg = segments[idx];
    onProgress?.(10 + (si / sampled.length) * 80, `Audio probe · ${si + 1}/${sampled.length}`);
    try {
      const bytes = await fetchSegmentBytes(initUri, seg.uri);
      const buffer = await ctx.decodeAudioData(bytes);
      decoded++;
      const offset = segments.slice(0, idx).reduce((a, s) => a + s.duration, 0);
      const ch = buffer.getChannelData(0);
      const echo = detectEcho(ch, buffer.sampleRate);
      results.push({ offset, ...echo });
      decodedBuffers.push({ offset, buffer });
    } catch {
      decodeFails++;
    }
  }

  if (decoded === 0) {
    await ctx.close();
    return emptyResult(
      "All audio segments failed to decode. This could be an unexpected segment format or a CDN change — check the browser console."
    );
  }

  await ctx.close();

  const loudness = computeLoudnessStats(decodedBuffers);
  onProgress?.(95, `Decoded ${decoded}/${sampled.length} segments (${decodeFails} failed).`);

  return { blocked: false, results, loudness, decodedBuffers };
}

/** Convenience re-export so callers building audio clips don't need a second import. */
export { detectAudioMoments };
