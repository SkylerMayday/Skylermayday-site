import type { MetadataRoute } from "next";
import { fetchBinderFile, sectionNameToSlug } from "@/lib/binders";

const BASE_URL = "https://skylermayday.com";

/**
 * Static top-level routes, hand-maintained. Priorities are relative within
 * this site only (Google ignores cross-site comparisons) — home highest,
 * the PTCG binders hub next since it's the site's most-invested feature,
 * everything else level.
 */
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
  { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE_URL}/content`, changeFrequency: "weekly", priority: 0.7 },
  { url: `${BASE_URL}/projects`, changeFrequency: "monthly", priority: 0.7 },
  {
    url: `${BASE_URL}/projects/ptcg-binders`,
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/projects/packs-of-noods`,
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: `${BASE_URL}/projects/stream-analyser`,
    changeFrequency: "monthly",
    priority: 0.5,
  },
  { url: `${BASE_URL}/shop`, changeFrequency: "weekly", priority: 0.7 },
  { url: `${BASE_URL}/contact`, changeFrequency: "yearly", priority: 0.3 },
];

/**
 * Binder-section pages are derived from live data, same source and same
 * try/catch-falls-back-to-empty guard as the section page's own
 * generateStaticParams (app/projects/ptcg-binders/[binderSlug]/[sectionSlug]/page.tsx)
 * — a transient upstream blip must not fail the whole sitemap.
 */
async function binderSectionRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const binderFile = await fetchBinderFile();
    return binderFile.binders.flatMap((binder) =>
      binder.sections.map((section) => ({
        url: `${BASE_URL}/projects/ptcg-binders/${binder.id}/${sectionNameToSlug(section.name)}`,
        changeFrequency: "weekly" as const,
        priority: 0.4,
      }))
    );
  } catch (err) {
    console.warn("[sitemap] binder section fetch failed, falling back to empty:", err);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sectionRoutes = await binderSectionRoutes();
  return [...STATIC_ROUTES, ...sectionRoutes];
}
