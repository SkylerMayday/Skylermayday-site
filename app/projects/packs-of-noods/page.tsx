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
    <div className="flex flex-col gap-8 py-10">
      <h1 className="text-3xl font-bold">Packs of Noods</h1>

      <p className="max-w-prose">
        A food IRL stream series with draftpicked, running since December 2022.
        Each episode explores a Singapore food spot &mdash; noodles are a
        recurring favourite, not the whole story &mdash; and ends with opening
        Pok&eacute;mon TCG packs at the table. #teamfatnoods.
      </p>

      <PonEpisodeFilter locations={locations} />
    </div>
  );
}
