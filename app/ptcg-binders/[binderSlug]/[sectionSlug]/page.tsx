import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchBinderFile,
  findBinderBySlug,
  findSectionBySlug,
  computeSectionCompletion,
  sectionNameToSlug,
  BindersApiError,
} from "@/lib/binders";
import CompletionBar from "@/components/binders/CompletionBar";
import BinderPageViewer from "@/components/binders/BinderPageViewer";
import ErrorState from "@/components/ui/ErrorState";
import { siteConfig } from "@/data/site-config";

export const revalidate = 900; // 15 min

interface SectionPageParams {
  binderSlug: string;
  sectionSlug: string;
}

/**
 * Derives {binderSlug, sectionSlug} pairs from live data (every binder x its
 * sections) so known sections pre-render. A transient GitHub blip must not
 * fail the whole deploy — guarded with a try/catch that falls back to an
 * empty param set (mirrors the [binderSlug] route's build guard). Unknown
 * slugs at request time still fall through to not-found.tsx regardless.
 */
export async function generateStaticParams(): Promise<SectionPageParams[]> {
  try {
    const binderFile = await fetchBinderFile();
    return binderFile.binders.flatMap((binder) =>
      binder.sections.map((section) => ({
        binderSlug: binder.id,
        sectionSlug: sectionNameToSlug(section.name),
      }))
    );
  } catch (err) {
    console.warn(
      "[ptcg-binders/[binderSlug]/[sectionSlug]] generateStaticParams fetch failed, falling back to empty:",
      err
    );
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<SectionPageParams>;
}): Promise<Metadata> {
  const { binderSlug, sectionSlug } = await params;

  try {
    const binderFile = await fetchBinderFile();
    const binder = findBinderBySlug(binderFile, binderSlug);
    const section = binder ? findSectionBySlug(binder, sectionSlug) : null;

    if (binder && section) {
      return {
        title: `${section.name} — ${binder.name} — PTCG Binders — ${siteConfig.brandName}`,
      };
    }
  } catch {
    // Fall through to the slug-based fallback below — never throw in metadata.
  }

  return { title: `${sectionSlug} — ${binderSlug} — PTCG Binders — ${siteConfig.brandName}` };
}

export default async function BinderSectionPage({
  params,
}: {
  params: Promise<SectionPageParams>;
}) {
  const { binderSlug, sectionSlug } = await params;

  let binderFile;
  try {
    binderFile = await fetchBinderFile();
  } catch (err) {
    if (err instanceof BindersApiError) {
      console.warn(
        "[ptcg-binders/[binderSlug]/[sectionSlug]] fetchBinderFile failed:",
        err.message
      );
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

  const section = findSectionBySlug(binder, sectionSlug);
  if (!section) {
    notFound();
  }

  const completion = computeSectionCompletion(section);

  return (
    <div className="flex flex-col gap-8 py-10">
      <Link
        href="/ptcg-binders"
        className="text-sm font-medium text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        &larr; Back to Binders
      </Link>

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold">{section.name}</h1>
        <CompletionBar completion={completion} label="Section completion" />
      </div>

      <BinderPageViewer sectionName={section.name} slots={section.slots} />
    </div>
  );
}
