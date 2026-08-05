import type { Metadata } from "next";
import { siteConfig } from "@/data/site-config";
import { loadPonLocations } from "@/lib/pon";
import PonEpisodeFilter from "@/components/pon/PonEpisodeFilter";

export const metadata: Metadata = {
  title: `Packs of Noods — ${siteConfig.brandName}`,
};

// No `revalidate`/`dynamic` export → statically rendered → loadPonLocations()
// runs at build time and malformed JSON fails the build loudly.
export default function PacksOfNoodsPage() {
  const locations = loadPonLocations();

  return (
    <div className="flex flex-col gap-8 py-16 sm:py-24">
      <h1 className="text-balance text-[40px] leading-[0.98] font-black tracking-[-0.03em] sm:text-[64px]">
        Packs of Noods
      </h1>

      {/* `prose-block` replaces `max-w-prose` — RISK 1's 17/1.65/68ch is a
          tighter, measured cap than Tailwind's generic 65ch-at-inherited-size
          default, and this is long-form body copy in the exact typeface the
          brief flags as weakest for it. */}
      <p className="prose-block text-fg-muted">
        A food IRL stream series with draftpicked, running since December 2022.
        Each episode explores a Singapore food spot &mdash; noodles are a
        recurring favourite, not the whole story &mdash; and ends with opening
        Pok&eacute;mon TCG packs at the table. #teamfatnoods.
      </p>

      <PonEpisodeFilter locations={locations} />
    </div>
  );
}
