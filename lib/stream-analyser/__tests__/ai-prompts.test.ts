import { describe, it, expect } from "vitest";
import { parseClaudeJson } from "@/lib/stream-analyser/title-rating";
import {
  titleRatingPrompt,
  feedbackPrompt,
  improvementNotesPrompt,
  metricsPrompt,
  discoverabilityPrompt,
  descriptionPrompt,
} from "@/lib/stream-analyser/ai-prompts";
import type { ChannelData, VodMeta } from "@/lib/stream-analyser/types";

describe("parseClaudeJson", () => {
  it("parses plain JSON", () => {
    expect(parseClaudeJson<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });

  it("strips ```json fences", () => {
    const raw = '```json\n{"a":1}\n```';
    expect(parseClaudeJson<{ a: number }>(raw)).toEqual({ a: 1 });
  });

  it("strips bare ``` fences without a language tag", () => {
    const raw = "```\n[1,2,3]\n```";
    expect(parseClaudeJson<number[]>(raw)).toEqual([1, 2, 3]);
  });

  it("throws on genuinely malformed JSON", () => {
    expect(() => parseClaudeJson("{not json")).toThrow();
  });

  it("trims surrounding whitespace", () => {
    expect(parseClaudeJson<{ a: number }>('   {"a":1}   \n')).toEqual({ a: 1 });
  });
});

describe("prompt builders", () => {
  const meta: VodMeta = { id: "1", title: "My Stream", duration: 3600, twitchClipCount: 2 };

  it("titleRatingPrompt returns maxTokens 1000 and embeds the title", () => {
    const spec = titleRatingPrompt("My Cool Stream");
    expect(spec.maxTokens).toBe(1000);
    expect(spec.user).toContain("My Cool Stream");
  });

  it("feedbackPrompt returns maxTokens 900", () => {
    const spec = feedbackPrompt(meta, [], [], null, []);
    expect(spec.maxTokens).toBe(900);
  });

  it("improvementNotesPrompt returns maxTokens 800", () => {
    const spec = improvementNotesPrompt(meta, [], [], null, []);
    expect(spec.maxTokens).toBe(800);
  });

  it("metricsPrompt returns maxTokens 500 and does not mention duration as a scoring signal", () => {
    const spec = metricsPrompt(meta, [], [], null);
    expect(spec.maxTokens).toBe(500);
  });

  it("discoverabilityPrompt returns maxTokens 1000 and embeds channel fields", () => {
    const channel: ChannelData = {
      id: "1",
      login: "someuser",
      displayName: "SomeUser",
      description: "desc",
      profileImageUrl: "",
      followers: 100,
      title: "Playing games",
      category: "Just Chatting",
      tags: ["English", "Chill"],
      language: "en",
    };
    const spec = discoverabilityPrompt(channel);
    expect(spec.maxTokens).toBe(1000);
    expect(spec.user).toContain("Playing games");
    expect(spec.user).toContain("Just Chatting");
  });

  it("descriptionPrompt returns maxTokens 900 and embeds the description", () => {
    const spec = descriptionPrompt("Welcome to my channel!");
    expect(spec.maxTokens).toBe(900);
    expect(spec.user).toContain("Welcome to my channel!");
  });
});
