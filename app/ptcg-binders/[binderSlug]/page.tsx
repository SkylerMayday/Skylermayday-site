import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchBinderFile,
  fetchChangelog,
  findBinderBySlug,
  computeCompletion,
  BindersApiError,
} from "@/lib/binders";
import CompletionBar from "@/components/binders/CompletionBar";
import BinderCardGrid from "@/components/binders/BinderCardGrid";
import Changelog from "@/components/binders/Changelog";
import ErrorState from "@/components/ui/ErrorState";
import { siteConfig } from "@/data/site-config";

export const revalidate = 900; // 15 min

interface BinderPageParams {
  binderSlug: string;
}

/**
 * Derives slugs from live binder ids so known binders pre-render. A
 * transient GitHub blip must not fail the whole deploy — guarded with a
 * try/catch that falls back to an empty param set (spec §4.7, §9 build
 * guard). Unknown slugs at request time still fall through to
 * not-found.tsx regardless.
 */
export async function generateStaticParams(): Promise<BinderPageParams[]> {
  try {
    const binderFile = await fetchBinderFile();
    return binderFile.binders.map((binder) => ({ binderSlug: binder.id }));
  } catch (err) {
    console.warn("[ptcg-binders/[slug]] generateStaticParams fetch failed, falling back to empty:", err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<BinderPageParams>;
}): Promise<Metadata> {
  const { binderSlug } = await params;
  return { title: `${binderSlug} — PTCG Binders — ${siteConfig.brandName}` };
}

export default async function BinderDetailPage({
  params,
}: {
  params: Promise<BinderPageParams>;
}) {
  const { binderSlug } = await params;

  let binderFile;
  try {
    binderFile = await fetchBinderFile();
  } catch (err) {
    if (err instanceof BindersApiError) {
      console.warn("[ptcg-binders/[slug]] fetchBinderFile failed:", err.message);
    }
    return (
      <div className="flex flex-col gap-8 py-10">
        <ErrorState message="Binders are temporarily unavailable." />
      </div>
    );
  }

  const binder = findBinderBySlug(binderFile, binderSlug);
  if (!binder) {
    notFound();
  }

  let changelogEntries: Awaited<ReturnType<typeof fetchChangelog>>["entries"] = [];
  try {
    const changelogFile = await fetchChangelog();
    changelogEntries = changelogFile.entries;
  } catch (err) {
    console.warn("[ptcg-binders/[slug]] fetchChangelog failed:", err);
    // Changelog is a secondary section — degrade gracefully rather than
    // failing the whole binder detail page.
  }

  const completion = computeCompletion(binder);

  return (
    <div className="flex flex-col gap-10 py-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold">{binder.name}</h1>
        <CompletionBar completion={completion} label="Overall completion" />
      </div>

      <BinderCardGrid sections={binder.sections} />

      <Changelog entries={changelogEntries} />
    </div>
  );
}
