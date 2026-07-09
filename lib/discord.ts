export class DiscordApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiscordApiError";
  }
}

// Public Discord server ("Skyler's Lounge") id — not a secret, just an
// identifier for the public Server Widget endpoint. Hardcoded as a const
// (same convention as twitch.ts's TOKEN_URL/HELIX_BASE) rather than an env
// var: it never changes per-environment and exposing it is harmless.
const GUILD_ID = "1157139196943798345";
const WIDGET_URL = `https://discord.com/api/guilds/${GUILD_ID}/widget.json`;

// Exact username of Skyler's Discord bot. The public widget.json exposes no
// `bot` flag on members, so identity is matched by username (verified against
// the live widget response, 2026-07-09).
const BOT_USERNAME = "SkeelerMeidai";

/** Discord widget member as returned by the public widget.json endpoint. */
interface WidgetMember {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  status: "online" | "idle" | "dnd";
  avatar_url: string;
  game?: { name: string };
}

interface WidgetResponse {
  id: string;
  name: string;
  members: WidgetMember[];
}

/** Resolved status of the SkylerMayday Discord bot from the public widget. */
export interface BotStatus {
  // true = bot is currently listed in the widget (i.e. online/idle/dnd).
  online: boolean;
  // present only when the bot is online; the widget's per-member avatar URL.
  avatarUrl: string | null;
  // present only when online; raw status string ("online" | "idle" | "dnd").
  presence: "online" | "idle" | "dnd" | null;
  // true when the widget itself couldn't be read (disabled / network / non-200).
  // The card renders an "unavailable" state rather than crashing the page.
  unavailable: boolean;
}

/**
 * Fetches the public Discord Server Widget JSON and reports whether the
 * SkylerMayday bot (username SkeelerMeidai) is currently online.
 *
 * Server-only. No bot token, no secret — the Server Widget endpoint is a
 * genuinely public unauthenticated API, available because the server owner
 * enabled "Server Widget" in Discord settings. If the widget is ever disabled
 * the endpoint returns 403; if the bot is offline it simply won't appear in
 * members[] (Discord omits offline members). Both cases are handled without
 * throwing to the page: `unavailable` is set for a read failure, `online:false`
 * for a genuine offline.
 */
export async function fetchBotStatus(): Promise<BotStatus> {
  const offlineDefault: BotStatus = {
    online: false,
    avatarUrl: null,
    presence: null,
    unavailable: false,
  };

  let response: Response;
  try {
    response = await fetch(WIDGET_URL, {
      // Presence changes often; short revalidate keeps the card fresh without
      // hammering Discord. 60s per the change spec.
      next: { revalidate: 60 },
    });
  } catch (err) {
    // Network failure — surface as unavailable, do not throw.
    console.warn("[discord] widget fetch network error:", (err as Error).message);
    return { ...offlineDefault, unavailable: true };
  }

  if (!response.ok) {
    // 403 = widget disabled; anything else non-200 = treat as unavailable.
    console.warn(`[discord] widget fetch failed: ${response.status} ${response.statusText}`);
    return { ...offlineDefault, unavailable: true };
  }

  let data: WidgetResponse;
  try {
    data = (await response.json()) as WidgetResponse;
  } catch (err) {
    console.warn("[discord] widget JSON parse error:", (err as Error).message);
    return { ...offlineDefault, unavailable: true };
  }

  const bot = data.members?.find((m) => m.username === BOT_USERNAME);
  if (!bot) {
    // Not listed ⇒ offline (Discord omits offline members). Not an error.
    return offlineDefault;
  }

  return {
    online: true,
    avatarUrl: bot.avatar_url ?? null,
    presence: bot.status,
    unavailable: false,
  };
}
