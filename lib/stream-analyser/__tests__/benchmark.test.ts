import { describe, it, expect } from "vitest";
import { buildBenchmark, buildBitrateModel, bitrateQuality } from "@/lib/stream-analyser/benchmark";
import type { ChatComment, VodMeta } from "@/lib/stream-analyser/types";

function makeComment(t: number, overrides: Partial<ChatComment> = {}): ChatComment {
  return {
    t,
    user: `user-${t}`,
    msg: "hello",
    emotes: [],
    badges: [],
    isSubscriber: false,
    isMod: false,
    isVIP: false,
    ...overrides,
  };
}

describe("buildBenchmark", () => {
  it("produces the base 9 rows, plus a 10th when twitchClipCount is present", () => {
    const meta: VodMeta = { id: "1", title: "t", duration: 3600, twitchClipCount: null };
    const model = buildBenchmark(meta, [], []);
    expect(model.rows).toHaveLength(9);

    const metaWithClips: VodMeta = { ...meta, twitchClipCount: 3 };
    const modelWithClips = buildBenchmark(metaWithClips, [], []);
    expect(modelWithClips.rows).toHaveLength(10);
    expect(modelWithClips.rows[9].label).toBe("Clips made by viewers");
  });

  it("marks chat velocity 'bad' when quiet, 'ok' when active", () => {
    const meta: VodMeta = { id: "1", title: "t", duration: 600, twitchClipCount: null }; // 10 min
    const quiet = buildBenchmark(meta, [makeComment(0)], []); // 1 msg / 10 min << 1/min
    const velocityRow = quiet.rows.find((r) => r.label === "Chat velocity")!;
    expect(velocityRow.status).toBe("bad");

    const busyComments: ChatComment[] = [];
    for (let t = 0; t < 600; t += 2) busyComments.push(makeComment(t)); // ~30/min
    const busy = buildBenchmark(meta, busyComments, []);
    const busyVelocityRow = busy.rows.find((r) => r.label === "Chat velocity")!;
    expect(busyVelocityRow.status).toBe("ok");
  });

  it("handles zero comments without dividing by zero", () => {
    const meta: VodMeta = { id: "1", title: "t", duration: 1200, twitchClipCount: null };
    expect(() => buildBenchmark(meta, [], [])).not.toThrow();
    const model = buildBenchmark(meta, [], []);
    const cpmRow = model.rows.find((r) => r.label === "Chat velocity")!;
    expect(cpmRow.value).toBe("0.0 msg/min");
  });
});

describe("buildBitrateModel", () => {
  const masterPlaylist = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=7000000,RESOLUTION=1920x1080,VIDEO="1080p60"
1080p60/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,VIDEO="720p30"
720p30/index.m3u8
`;

  it("returns null when no variants are found", () => {
    expect(buildBitrateModel("#EXTM3U\n")).toBeNull();
  });

  it("parses variants sorted by bandwidth descending, with a source note", () => {
    const model = buildBitrateModel(masterPlaylist);
    expect(model).not.toBeNull();
    expect(model!.variants).toHaveLength(2);
    expect(model!.variants[0].bw).toBe(7000000);
    expect(model!.variants[0].name).toBe("1080p60");
    expect(model!.sourceNote).toContain("excellent");
  });
});

describe("bitrateQuality", () => {
  it("classifies good/mid/low at the documented thresholds", () => {
    expect(bitrateQuality(6_000_000)).toBe("good");
    expect(bitrateQuality(5_999_999)).toBe("mid");
    expect(bitrateQuality(3_000_000)).toBe("mid");
    expect(bitrateQuality(2_999_999)).toBe("low");
  });
});
