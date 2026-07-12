/**
 * Static, hand-edited site copy. No API calls in this module — Skyler edits
 * this file directly for About/Home copy, platform links, and the streaming
 * schedule.
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
  tagline:
    "Cozy + hype variety streamer from Singapore — games, Pokémon TCG, food, and builds.",
  heroBlurb:
    "Live on Twitch Mondays. Chasing Pokédex completion, hunting good food around Singapore, and building things in between streams.",
  aboutBio: [
    "I'm Skyler — better known as SkylerMayday — a variety streamer from Singapore. I've been on Twitch since 2013, streaming a bit of everything: games of all kinds, Pokémon TCG pack openings (a 20-plus-year collecting habit), and food adventures around the island with the packs-of-noods crew. #teamfatnoods",
    "The vibe is cozy first — a safe, chill space where chat is part of the room, with genuine hype when the moment earns it. Regulars get greeted by name, lurkers get invited in, and my co-host (and wife) Sparks plus Bailey the chinchilla make regular appearances.",
    "Off-stream I build the tools on this site — a stream analyser, a Pokédex collection tracker, a Discord bot, and whatever else the stream needs next.",
  ],
  brandStory: [
    "Streaming isn't just pressing the start button. It's experimenting, learning new things, playing games worth talking about, making friends, and building a community — that overlap is why I do it.",
    "The goal hasn't changed since day one: keep it a safe space, keep the reactions genuine, and support local — Singapore creators, indie studios, and every food spot the stream visits.",
  ],

  platformLinks: [
    {
      platform: "Twitch",
      handle: "skylermayday",
      url: "https://twitch.tv/skylermayday",
    },
    {
      platform: "TikTok",
      handle: "@skylermayday",
      url: "https://www.tiktok.com/@skylermayday",
    },
    {
      platform: "Instagram",
      handle: "@skylermayday",
      url: "https://www.instagram.com/skylermayday",
    },
    {
      platform: "YouTube",
      handle: "@skylermayday",
      url: "https://youtube.com/@skylermayday",
    },
  ] satisfies PlatformLink[],

  schedule: [
    {
      day: "Mondays",
      time: "~8:00 PM SGT",
      what: "Variety stream — games + Pokémon TCG pack openings",
    },
    {
      day: "Roughly monthly",
      time: "—",
      what: "Packs of Noods — food IRL stream around Singapore",
    },
  ] satisfies ScheduleRow[],

  discordInviteUrl: "", // [VERIFY] placeholder — fill with real Discord invite link when available
} as const;
