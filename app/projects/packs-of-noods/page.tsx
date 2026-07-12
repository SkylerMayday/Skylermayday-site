import type { Metadata } from "next";
import { siteConfig } from "@/data/site-config";
import { loadPonLocations, computePonStats, formatMonth } from "@/lib/pon";

export const metadata: Metadata = {
  title: `Packs of Noods — ${siteConfig.brandName}`,
};

const EM_DASH = "—";

/** Renders an em dash for empty freeform cells so rows never look broken. */
function cellText(value: string): string {
  return value === "" ? EM_DASH : value;
}

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

      <div className="flex flex-col gap-2">
        {/* The table scrolls inside its own container so the page body never
            scrolls horizontally at narrow viewports. */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Location</th>
                <th className="py-2 pr-4 font-medium">Content</th>
                <th className="py-2 pr-4 font-medium">Guests</th>
                <th className="py-2 pr-4 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((row, index) => (
                <tr
                  key={`${row.date}-${row.name}-${index}`}
                  className="border-b border-neutral-100 align-top dark:border-neutral-800"
                >
                  <td className="py-2 pr-4 whitespace-nowrap">{formatMonth(row.date)}</td>
                  <td className="py-2 pr-4">{row.name}</td>
                  <td className="py-2 pr-4">{row.location}</td>
                  <td className="py-2 pr-4">{cellText(row.content)}</td>
                  <td className="py-2 pr-4">{cellText(row.guests)}</td>
                  <td className="py-2 pr-4">{cellText(row.notes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-neutral-500">
          PC = Permanently Closed &middot; TC = Temporarily Closed &middot; OOA
          = Other Outlets Available.
        </p>
      </div>
    </div>
  );
}
