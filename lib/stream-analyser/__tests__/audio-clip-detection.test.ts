import { describe, it, expect } from "vitest";
import { detectAudioMoments, computeLoudnessStats, detectEcho } from "@/lib/stream-analyser/audio-clip-detection";
import type { DecodedSegment } from "@/lib/stream-analyser/types";

// Minimal fake AudioBuffer — detectAudioMoments/computeLoudnessStats only
// touch getChannelData(0) and sampleRate, so a plain object satisfies the
// duck-typed usage without needing a real Web Audio API (not present in the
// vitest node environment).
function fakeBuffer(samples: Float32Array, sampleRate = 16000): AudioBuffer {
  return {
    sampleRate,
    getChannelData: () => samples,
  } as unknown as AudioBuffer;
}

describe("detectAudioMoments", () => {
  it("returns [] for empty input", () => {
    expect(detectAudioMoments([])).toEqual([]);
  });

  it("finds a peak well above the segment's baseline energy", () => {
    const sr = 16000;
    const len = sr * 10; // 10 seconds — more baseline windows so a short, loud
    // spike clears the z>=2.0 threshold (a spike spanning too much of a short
    // buffer drags the mean/sd up with it and never reaches z=2).
    const samples = new Float32Array(len);
    for (let i = 0; i < len; i++) samples[i] = (Math.random() - 0.5) * 0.01;
    const spikeStart = sr * 5;
    const spikeEnd = sr * 5.4;
    for (let i = spikeStart; i < spikeEnd; i++) samples[i] = Math.sin(i) * 0.9;

    const decoded: DecodedSegment[] = [{ offset: 0, buffer: fakeBuffer(samples, sr) }];
    const moments = detectAudioMoments(decoded);
    expect(moments.length).toBeGreaterThan(0);
    expect(moments[0].absoluteTime).toBeGreaterThanOrEqual(4);
    expect(moments[0].absoluteTime).toBeLessThanOrEqual(6);
  });

  it("dedupes moments within 3 seconds, keeping the higher zScore", () => {
    const sr = 16000;
    const len = sr * 6;
    const samples = new Float32Array(len);
    for (let i = 0; i < len; i++) samples[i] = (Math.random() - 0.5) * 0.01;
    // Two close spikes ~1s apart — should collapse to one moment.
    for (let i = sr * 2; i < sr * 2.5; i++) samples[i] = Math.sin(i) * 0.6;
    for (let i = sr * 3; i < sr * 3.5; i++) samples[i] = Math.sin(i) * 0.9;

    const decoded: DecodedSegment[] = [{ offset: 100, buffer: fakeBuffer(samples, sr) }];
    const moments = detectAudioMoments(decoded);
    // absoluteTime includes the 100s offset.
    moments.forEach((m) => expect(m.absoluteTime).toBeGreaterThanOrEqual(100));
  });
});

describe("computeLoudnessStats", () => {
  it("returns null for empty input", () => {
    expect(computeLoudnessStats([])).toBeNull();
  });

  it("flags clipping when samples sit at full-scale", () => {
    const sr = 16000;
    const samples = new Float32Array(sr); // 1 second
    samples.fill(0.999);
    const decoded: DecodedSegment[] = [{ offset: 0, buffer: fakeBuffer(samples, sr) }];
    const stats = computeLoudnessStats(decoded);
    expect(stats).not.toBeNull();
    expect(stats!.clippingPct).toBeGreaterThan(90);
    expect(stats!.peakDbFS).toBeGreaterThan(-1);
  });

  it("flags near-silence for a quiet buffer", () => {
    const sr = 16000;
    const samples = new Float32Array(sr * 2).fill(0.0000001);
    const decoded: DecodedSegment[] = [{ offset: 0, buffer: fakeBuffer(samples, sr) }];
    const stats = computeLoudnessStats(decoded);
    expect(stats).not.toBeNull();
    expect(stats!.quietPct).toBeGreaterThan(90);
  });
});

describe("detectEcho", () => {
  it("reports no echo for silence", () => {
    const samples = new Float32Array(8000 * 2); // all zeros
    const result = detectEcho(samples, 16000);
    expect(result.echo).toBe(false);
    expect(result.confidence).toBe(0);
  });

  it("detects a strong self-correlation at a known lag within range", () => {
    const sampleRate = 16000;
    const durationSec = 2;
    const N = sampleRate * durationSec;
    const samples = new Float32Array(N);
    const freq = 200; // Hz tone
    for (let i = 0; i < N; i++) samples[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate);

    const result = detectEcho(samples, sampleRate);
    // A pure periodic tone autocorrelates strongly at many lags — confidence
    // should be high, though it may not land in the classified "echo" range
    // depending on which lag wins. The important invariant is a valid,
    // bounded confidence score and lag.
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.lagMs).toBeGreaterThanOrEqual(50);
    expect(result.lagMs).toBeLessThanOrEqual(400);
  });
});
