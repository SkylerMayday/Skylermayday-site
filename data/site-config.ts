/**
 * Static, hand-edited site copy. No API calls in this module — Skyler edits
 * this file directly for About/Home copy, platform links, and the streaming
 * schedule. Placeholder copy below; real copy to be filled in per spec §10
 * item 4.
 */

export interface PlatformLink {
  platform: string;
  handle: string;
  url: string;
}

export interface ScheduleRow {
  day: string;
  time: string; // e.g. "8:00 PM SGT"
  what: string;
}

export const siteConfig = {
  brandName: "SkylerMayday",
  tagline: "Streamer, creator, and Pokémon TCG collector.", // [VERIFY] placeholder — Skyler to confirm brand line
  heroBlurb:
    "Catching clips, chasing Pokédex completion, and building things in between streams.", // placeholder
  aboutBio:
    "Placeholder bio — Skyler to replace with real about-me copy covering background, what the channel is about, and what viewers can expect.",
  brandStory:
    "Placeholder brand story — the why behind the content, streaming, and collecting.",

  platformLinks: [
    {
      platform: "Twitch",
      handle: "@skylermayday", // [VERIFY] confirm exact handle
      url: "https://twitch.tv/skylermayday",
    },
    {
      platform: "YouTube",
      handle: "@skylermayday", // [VERIFY] confirm exact handle
      url: "https://youtube.com/@skylermayday",
    },
    {
      platform: "TikTok",
      handle: "@skylermayday", // [VERIFY] confirm exact handle
      url: "https://www.tiktok.com/@skylermayday",
    },
  ] satisfies PlatformLink[],

  schedule: [
    { day: "Mon", time: "TBD", what: "Streaming schedule placeholder" },
    { day: "Wed", time: "TBD", what: "Streaming schedule placeholder" },
    { day: "Sat", time: "TBD", what: "Streaming schedule placeholder" },
  ] satisfies ScheduleRow[],

  discordInviteUrl: "", // [VERIFY] placeholder — fill with real Discord invite link when available
} as const;
