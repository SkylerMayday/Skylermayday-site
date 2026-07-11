import type { Metadata } from "next";
import {
  fetchBinderFile,
  fetchChangelog,
  computeCompletion,
  findBinderBySlug,
  partitionBindersByShelf,
  POKEDEX_BINDER_ID,
  BindersApiError,
} from "@/lib/binders";
import BinderBookcase from "@/components/binders/BinderBookcase";
import CompletionBar from "@/components/binders/CompletionBar";
import Changelog from "@/components/binders/Changelog";
import ErrorState from "@/components/ui/ErrorState";
import { siteConfig } from "@/data/site-config";

export const revalidate = 900; // 15 min

export const metadata: Metadata = {
  title: `PTCG Binders — ${siteConfig.brandName}`,
};

export default async function BindersOverviewPage() {
  let binderFile;
  try {
    binderFile = await fetchBinderFile();
  } catch (err) {
    if (err instanceof BindersApiError) {
      console.warn("[ptcg-binders] fetchBinderFile failed:", err.message);
    } else {
      console.warn("[ptcg-binders] unexpected error:", err);
    }

    return (
      <div className="flex flex-col gap-8 py-10">
        <h1 className="text-3xl font-bold">PTCG Binders</h1>
        <ErrorState message="Binders are temporarily unavailable." />
      </div>
    );
  }

  let changelogEntries: Awaited<ReturnType<typeof fetchChangelog>>["entries"] = [];
  try {
    const changelogFile = await fetchChangelog();
    changelogEntries = changelogFile.entries;
  } catch (err) {
    console.warn("[ptcg-binders] fetchChangelog failed:", err);
    // Changelog is a secondary section — degrade gracefully rather than
    // failing the whole overview page.
  }

  // Completion bar is Pokédex-only (second-bookshelf spec decision 5):
  // Card History / Personal Collection aren't dex-completion-shaped data, so
  // mixing them into one percentage would be meaningless. Reuse the existing
  // domain helpers — do NOT re-implement slot logic.
  const pokedexBinder = findBinderBySlug(binderFile, POKEDEX_BINDER_ID);
  const overall = pokedexBinder
    ? computeCompletion(pokedexBinder)
    : { filled: 0, total: 0, pct: 0 };

  const { shelf1, shelf2 } = partitionBindersByShelf(binderFile.binders);

  return (
    <div className="flex flex-col gap-8 py-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold">PTCG Binders</h1>
        <CompletionBar completion={overall} label="Pokédex completion" />
      </div>

      <Changelog entries={changelogEntries} />

      <BinderBookcase
        binders={shelf1}
        heading="Pokédex"
        emptyMessage="No binders published yet."
      />
      <BinderBookcase
        binders={shelf2}
        heading="Personal Collection"
        emptyMessage="More binders coming soon."
      />
    </div>
  );
}
