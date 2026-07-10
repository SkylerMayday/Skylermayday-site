/**
 * Typed, fail-fast environment variable access.
 *
 * Each getter is lazy (read on access, not at import time) so a page that
 * doesn't need e.g. Twitch vars doesn't force those vars to exist just
 * because some other module in the dependency graph imports this file.
 * A missing *required* var throws loudly the moment it's actually needed —
 * never silently falls back to an empty string for a required value.
 */

function requireVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optionalVar(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.length > 0 ? value : fallback;
}

export const env = {
  // --- Twitch ---
  get TWITCH_CLIENT_ID(): string {
    return requireVar("TWITCH_CLIENT_ID");
  },
  get TWITCH_CLIENT_SECRET(): string {
    return requireVar("TWITCH_CLIENT_SECRET");
  },
  get TWITCH_BROADCASTER_ID(): string {
    return requireVar("TWITCH_BROADCASTER_ID");
  },

  // --- YouTube ---
  get YOUTUBE_API_KEY(): string {
    return requireVar("YOUTUBE_API_KEY");
  },
  get YOUTUBE_CHANNEL_ID(): string {
    return requireVar("YOUTUBE_CHANNEL_ID");
  },

  // --- Resend / contact email ---
  get RESEND_API_KEY(): string {
    return requireVar("RESEND_API_KEY");
  },
  get CONTACT_TO_EMAIL(): string {
    return requireVar("CONTACT_TO_EMAIL");
  },
  get CONTACT_FROM_EMAIL(): string {
    return requireVar("CONTACT_FROM_EMAIL");
  },

  // --- Discord ---
  get DISCORD_WEBHOOK_URL(): string {
    return requireVar("DISCORD_WEBHOOK_URL");
  },

  // --- Anthropic / Claude relay (Stream Analyser AI cards) ---
  get ANTHROPIC_API_KEY(): string {
    return requireVar("ANTHROPIC_API_KEY");
  },

  // --- Tools page ---
  // Not secret, but intentionally NOT NEXT_PUBLIC_: read server-side and
  // passed down as a prop per spec §2 rationale (keep one convention for
  // "all credentialed/external-config reads happen server-side").
  get STREAM_ANALYSER_URL(): string | null {
    const value = process.env.STREAM_ANALYSER_URL;
    return value && value.length > 0 ? value : null;
  },

  // --- Binders ---
  get GITHUB_BINDERS_RAW_BASE(): string {
    return optionalVar(
      "GITHUB_BINDERS_RAW_BASE",
      "https://raw.githubusercontent.com/SkylerMayday/binders-pokedex-binder/main"
    );
  },
} as const;

/** Returns true if every var required for Twitch calls is present, without throwing. */
export function hasTwitchEnv(): boolean {
  return Boolean(
    process.env.TWITCH_CLIENT_ID &&
      process.env.TWITCH_CLIENT_SECRET &&
      process.env.TWITCH_BROADCASTER_ID
  );
}

/** Returns true if every var required for YouTube calls is present, without throwing. */
export function hasYouTubeEnv(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_CHANNEL_ID);
}

/** Returns true if every var required for the contact route's email leg is present. */
export function hasResendEnv(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY &&
      process.env.CONTACT_FROM_EMAIL &&
      process.env.CONTACT_TO_EMAIL
  );
}

/** Returns true if the Discord webhook var is present. */
export function hasDiscordEnv(): boolean {
  return Boolean(process.env.DISCORD_WEBHOOK_URL);
}

/** Returns true if the Anthropic API key var is present. */
export function hasAnthropicEnv(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
