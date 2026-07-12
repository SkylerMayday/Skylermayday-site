import { describe, it, expect } from "vitest";
import { discordCommandGroups } from "@/data/discord-commands";

// Mod/admin-gated commands that must NEVER appear on the public card.
// `tempchannel setup` is the admin variant — `!tempchannel create` is public
// and allowed, so match the exact forbidden phrase, not the bare substring.
const FORBIDDEN_TOKENS = [
  "!warn",
  "!ban",
  "!purge",
  "giveaway start",
  "!reminder",
  "!quotemgr",
  "!welcome",
  "!logsetup",
  "!livestream",
  "setlevelchannel",
  "levelrole",
  "tempchannel setup",
];

describe("discordCommandGroups", () => {
  it("contains exactly the 8 public groups in spec order", () => {
    expect(discordCommandGroups.map((g) => g.group)).toEqual([
      "XP & Levels",
      "Quotes",
      "Music",
      "Translation",
      "Birthdays",
      "Temp voice channels",
      "Giveaways",
      "Help",
    ]);
  });

  it("leaks no mod/admin command in any group name, note, or command", () => {
    const allText = discordCommandGroups
      .flatMap((g) => [g.group, g.note ?? "", ...g.commands])
      .join(" ")
      .toLowerCase();

    for (const token of FORBIDDEN_TOKENS) {
      expect(allText).not.toContain(token);
    }
  });

  it("keeps required public commands present", () => {
    const allCommands = discordCommandGroups.flatMap((g) => g.commands);
    expect(allCommands).toContain("!rank (aliases !level, !xp)");
    expect(allCommands).toContain("!play <song/url>");
    expect(allCommands).toContain("!birthday remove");
    expect(allCommands).toContain("!help");
  });
});
