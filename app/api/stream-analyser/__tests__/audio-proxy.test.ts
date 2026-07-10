import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/stream-analyser/audio-proxy/route";

describe("GET /api/stream-analyser/audio-proxy", () => {
  it("returns 400 when init is missing", async () => {
    const request = new Request("http://localhost/api/stream-analyser/audio-proxy?seg=https://usher.ttvnw.net/seg.ts");
    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 when seg is missing", async () => {
    const request = new Request("http://localhost/api/stream-analyser/audio-proxy?init=https://usher.ttvnw.net/init.mp4");
    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it("returns 403 when init is not an allowed domain", async () => {
    const request = new Request(
      "http://localhost/api/stream-analyser/audio-proxy?init=https://evil.example.com/init.mp4&seg=https://usher.ttvnw.net/seg.ts"
    );
    const response = await GET(request);
    expect(response.status).toBe(403);
  });

  it("returns 403 when seg is not an allowed domain", async () => {
    const request = new Request(
      "http://localhost/api/stream-analyser/audio-proxy?init=https://usher.ttvnw.net/init.mp4&seg=https://evil.example.com/seg.ts"
    );
    const response = await GET(request);
    expect(response.status).toBe(403);
  });

  it("accepts allowed .ttvnw.net and .cloudfront.net hosts (no 403)", async () => {
    // These will fail at the network-fetch stage (no real server), which is
    // fine — the assertion here is only that the allowlist check passes and
    // execution proceeds past the 403 branch (network errors surface as 502).
    const request = new Request(
      "http://localhost/api/stream-analyser/audio-proxy?init=https://d1abc.cloudfront.net/init.mp4&seg=https://d1abc.cloudfront.net/seg.ts"
    );
    const response = await GET(request);
    expect(response.status).not.toBe(403);
    expect(response.status).not.toBe(400);
  });
});
