import { describe, it, expect } from "vitest";
import { scoreClips, scoreAudioClips, dedupClips, clipReason } from "@/lib/stream-analyser/chat-clip-detection";
import type { ChatClip, ChatComment } from "@/lib/stream-analyser/types";

function makeComment(overrides: Partial<ChatComment>): ChatComment {
  return {
    t: 0,
    user: "user1",
    msg: "hello",
    emotes: [],
    badges: [],
    isSubscriber: false,
    isMod: false,
    isVIP: false,
    ...overrides,
  };
}

describe("scoreClips", () => {
  it("returns [] for empty comments", () => {
    expect(scoreClips([], 600)).toEqual([]);
  });

  it("detects a chat spike window and ranks it highest", () => {
    const comments: ChatComment[] = [];
    // Baseline chatter every 20s across a 600s VOD.
    for (let t = 0; t < 600; t += 20) {
      comments.push(makeComment({ t, user: `baseline-${t}` }));
    }
    // A dense burst of unique users + hype keywords around t=300.
    for (let i = 0; i < 30; i++) {
      comments.push(makeComment({ t: 300 + i * 0.3, user: `burst-${i}`, msg: "POG that was insane W" }));
    }

    const clips = scoreClips(comments, 600);
    expect(clips.length).toBeGreaterThan(0);
    expect(clips[0].start).toBeLessThanOrEqual(300);
    expect(clips[0].end).toBeGreaterThanOrEqual(300);
  });

  it("caps results at 12 non-overlapping windows", () => {
    const comments: ChatComment[] = [];
    for (let t = 0; t < 3600; t += 5) {
      comments.push(makeComment({ t, user: `u${t}`, msg: "pog insane W clutch" }));
    }
    const clips = scoreClips(comments, 3600);
    expect(clips.length).toBeLessThanOrEqual(12);
  });
});

describe("clipReason", () => {
  it("falls back to message count when nothing else stands out", () => {
    const clip: ChatClip = {
      start: 0,
      end: 30,
      score: 0,
      z: 0,
      laughs: 0,
      hype: 0,
      hypeEmotes: 0,
      unique: 2,
      msgCount: 5,
      sample: [],
    };
    expect(clipReason(clip)).toBe("5 messages in window");
  });

  it("surfaces velocity + laugh signals when present", () => {
    const clip: ChatClip = {
      start: 0,
      end: 30,
      score: 5,
      z: 2.5,
      laughs: 8,
      hype: 0,
      hypeEmotes: 0,
      unique: 2,
      msgCount: 20,
      sample: [],
    };
    const reason = clipReason(clip);
    expect(reason).toContain("2.5σ");
    expect(reason).toContain("8 laugh reactions");
  });
});

describe("scoreAudioClips", () => {
  it("returns [] when energyCurve has fewer than 3 points", () => {
    expect(scoreAudioClips([{ t: 0, rms: 0.5 }], 600)).toEqual([]);
  });

  it("flags a spike well above the normalised baseline", () => {
    const curve = [];
    for (let t = 0; t < 600; t += 10) {
      curve.push({ t, rms: t === 300 ? 1.0 : 0.05 });
    }
    const clips = scoreAudioClips(curve, 600);
    expect(clips.length).toBeGreaterThan(0);
  });
});

describe("dedupClips", () => {
  it("drops audio clips within 45s of a chat clip", () => {
    const chatClips: ChatClip[] = [
      { start: 100, end: 130, score: 5, z: 2, laughs: 0, hype: 0, hypeEmotes: 0, unique: 5, msgCount: 10, sample: [] },
    ];
    const audioClips = [
      { start: 110, end: 140, score: 3, z: 1, rms: 0.5 }, // within 45s -> dropped
      { start: 500, end: 530, score: 4, z: 1.5, rms: 0.6 }, // far away -> kept
    ];
    const result = dedupClips(audioClips, chatClips);
    expect(result.audioClips).toHaveLength(1);
    expect(result.audioClips[0].start).toBe(500);
    expect(result.chatClips).toHaveLength(1);
  });

  it("caps chat clips at 15 and audio clips at 15", () => {
    const chatClips: ChatClip[] = Array.from({ length: 20 }, (_, i) => ({
      start: i * 100,
      end: i * 100 + 20,
      score: 1,
      z: 1,
      laughs: 0,
      hype: 0,
      hypeEmotes: 0,
      unique: 1,
      msgCount: 1,
      sample: [],
    }));
    const audioClips = Array.from({ length: 20 }, (_, i) => ({
      start: i * 100 + 60,
      end: i * 100 + 90,
      score: 1,
      z: 1,
      rms: 0.5,
    }));
    const result = dedupClips(audioClips, chatClips);
    expect(result.chatClips.length).toBeLessThanOrEqual(15);
    expect(result.audioClips.length).toBeLessThanOrEqual(15);
  });
});
