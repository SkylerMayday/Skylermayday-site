import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchBotStatus } from "@/lib/discord";

// Minimal shape of the widget payload the tests exercise.
interface WidgetPayload {
  id: string;
  name: string;
  instant_invite: string | null;
  members: Array<{
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    status: string;
    avatar_url: string;
  }>;
}

const INVITE_URL = "https://discord.com/invite/dns2Eatr";

const widget = (over?: Partial<WidgetPayload>): WidgetPayload => ({
  id: "1157139196943798345",
  name: "Skyler's Lounge",
  instant_invite: INVITE_URL,
  members: [],
  ...over,
});

const botMember = {
  id: "1",
  username: "SkeelerMeidai",
  discriminator: "0000",
  avatar: null,
  status: "online",
  avatar_url: "https://cdn/avatar.png",
};

/** Minimal Response-like object accepted by fetchBotStatus. */
const okResponse = (payload: unknown) => ({
  ok: true,
  status: 200,
  statusText: "OK",
  json: async () => payload,
});

describe("fetchBotStatus", () => {
  beforeEach(() => {
    // Expected console.warn noise from the failure paths — keep test output clean.
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reports online with avatar, presence, and invite when the bot is listed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => okResponse(widget({ members: [botMember] }))),
    );

    const status = await fetchBotStatus();
    expect(status).toEqual({
      online: true,
      avatarUrl: "https://cdn/avatar.png",
      presence: "online",
      unavailable: false,
      inviteUrl: INVITE_URL,
    });
  });

  it("keeps the invite when the widget is readable but the bot is offline", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okResponse(widget({ members: [] }))));

    const status = await fetchBotStatus();
    expect(status).toEqual({
      online: false,
      avatarUrl: null,
      presence: null,
      unavailable: false,
      inviteUrl: INVITE_URL,
    });
  });

  it("returns inviteUrl null when the widget has no invite channel configured", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => okResponse(widget({ instant_invite: null, members: [botMember] }))),
    );

    const status = await fetchBotStatus();
    expect(status.online).toBe(true);
    expect(status.inviteUrl).toBeNull();
    expect(status.unavailable).toBe(false);
  });

  it("normalizes a missing instant_invite field (older payloads) to null, not undefined", async () => {
    // Older/edge widget payloads may omit the field entirely — `?? null` must
    // normalize it so BotStatus.inviteUrl is strictly string | null.
    const payloadWithoutInvite: Record<string, unknown> = {
      ...widget({ members: [botMember] }),
    };
    delete payloadWithoutInvite.instant_invite;
    vi.stubGlobal("fetch", vi.fn(async () => okResponse(payloadWithoutInvite)));

    const status = await fetchBotStatus();
    expect(status.online).toBe(true);
    expect(status.inviteUrl).toBeNull();
  });

  it("reports unavailable with no invite on a network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    const status = await fetchBotStatus();
    expect(status.unavailable).toBe(true);
    expect(status.inviteUrl).toBeNull();
    expect(status.online).toBe(false);
  });

  it("reports unavailable with no invite on a non-200 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: async () => ({}),
      })),
    );

    const status = await fetchBotStatus();
    expect(status.unavailable).toBe(true);
    expect(status.inviteUrl).toBeNull();
  });

  it("reports unavailable with no invite when the JSON body fails to parse", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => {
          throw new Error("bad");
        },
      })),
    );

    const status = await fetchBotStatus();
    expect(status.unavailable).toBe(true);
    expect(status.inviteUrl).toBeNull();
  });
});
