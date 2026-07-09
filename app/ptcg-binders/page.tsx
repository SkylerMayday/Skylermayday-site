import type { Metadata } from "next";
import {
  fetchBinderFile,
  fetchChangelog,
  computeCompletion,
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

  // Overall = combine every binder's completion; with one binder this
  // equals computeCompletion(binders[0]). Reuse computeCompletion per
  // binder and aggregate filled/total (do NOT re-implement slot logic).
  const overall = binderFile.binders.reduce(
    (acc, b) => {
      const c = computeCompletion(b);
      const filled = acc.filled + c.filled;
      const total = acc.total + c.total;
      return { filled, total, pct: total === 0 ? 0 : Math.round((filled / total) * 100) };
    },
    { filled: 0, total: 0, pct: 0 }
  );

  return (
    <div className="flex flex-col gap-8 py-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold">PTCG Binders</h1>
        <CompletionBar completion={overall} label="Pokédex completion" />
      </div>

      <Changelog entries={changelogEntries} />

      <BinderBookcase binders={binderFile.binders} />
    </div>
  );
}
