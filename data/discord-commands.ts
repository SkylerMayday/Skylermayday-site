/**
 * Public Discord commands shown on the /projects bot card — everything here is
 * available to everyone (NO permission gate). Verified against the bot's actual
 * permission gates (D:\Claude Projects\DiscordBot\src\modules\*). Do NOT add any
 * mod/admin command (see the forbidden list in data/discord-commands.test.ts).
 */
export interface DiscordCommandGroup {
  /** Group heading, e.g. "XP & Levels". */
  group: string;
  /** How-to prose with no command tokens (e.g. "Earn XP by chatting..."). Rendered as plain text. Optional. */
  note?: string;
  /** Command entries, each rendered verbatim as an inline <code> chip. May be empty (note-only group). */
  commands: string[];
}

export const discordCommandGroups: DiscordCommandGroup[] = [
  {
    group: "XP & Levels",
    note: "Earn XP by chatting and hanging out in voice.",
    commands: ["!rank (aliases !level, !xp)", "!leaderboard (!lb, !top)"],
  },
  {
    group: "Quotes",
    note: "React 💬 to any message to save it.",
    commands: ["!quote", "!quote #<id>", "!quote <category>", "!animequote"],
  },
  {
    group: "Music",
    commands: [
      "!play <song/url>",
      "!skip",
      "!pause",
      "!resume",
      "!stop",
      "!queue",
      "!nowplaying",
      "!loop",
      "!volume <0-100>",
    ],
  },
  {
    group: "Translation",
    commands: ["!translate <text> (to English)", "!translate <lang> <text>"],
  },
  {
    group: "Birthdays",
    commands: ["!birthday set <day> <month> [year]", "!birthday remove"],
  },
  {
    group: "Temp voice channels",
    commands: ["!tempchannel create [name] [limit]", "!templock", "!tempunlock", "!templimit <n>"],
  },
  {
    group: "Giveaways",
    note: "React 🎉 on a giveaway post to enter (remove to un-enter).",
    commands: [],
  },
  {
    group: "Help",
    note: "Full command list in Discord.",
    commands: ["!help"],
  },
];
