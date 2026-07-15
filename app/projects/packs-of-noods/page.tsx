import type { Metadata } from "next";
import { siteConfig } from "@/data/site-config";
import { loadPonLocations, computePonStats } from "@/lib/pon";
import PonEpisodeFilter from "@/components/pon/PonEpisodeFilter";

export const metadata: Metadata = {
  title: `Packs of Noods — ${siteConfig.brandName}`,
};

// No `revalidate`/`dynamic` export → statically rendered → loadPonLocations()
// runs at build time and malformed JSON fails the build loudly.
export default function PacksOfNoodsPage() {
  const locations = loadPonLocations();
  const stats = computePonStats(locations);

  const statCards: { label: string; value: string }[] = [
    { label: "Total visits", value: String(stats.totalVisits) },
    { label: "Distinct spots", value: String(stats.distinctLocations) },
    { label: "Date range", value: stats.dateRange },
    { label: "Top cuisine", value: stats.topCuisine },
  ];

  return (
    <div className="flex flex-col gap-8 py-10">
      <h1 className="text-3xl font-bold">Packs of Noods</h1>

      <p className="max-w-prose">
        A food IRL stream series with draftpicked, running since December 2022.
        Each episode explores a Singapore food spot &mdash; noodles are a
        recurring favourite, not the whole story &mdash; and ends with opening
        Pok&eacute;mon TCG packs at the table. #teamfatnoods.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <PonEpisodeFilter locations={locations} />
    </div>
  );
}
