import type { Metadata } from "next";
import Link from "next/link";
import { env } from "@/lib/env";
import { siteConfig } from "@/data/site-config";

export const metadata: Metadata = {
  title: `Tools — ${siteConfig.brandName}`,
};

export default function ToolsPage() {
  const streamAnalyserUrl = env.STREAM_ANALYSER_URL;

  return (
    <div className="flex flex-col gap-8 py-10">
      <h1 className="text-3xl font-bold">Tools</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {streamAnalyserUrl ? (
          <a
            href={streamAnalyserUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-6 transition hover:shadow-md dark:border-neutral-800"
          >
            <h2 className="text-lg font-semibold">Stream Analyser</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Analyse stream performance and stats. Opens in a new tab.
            </p>
          </a>
        ) : (
          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-neutral-300 p-6 text-neutral-400 dark:border-neutral-700">
            <h2 className="text-lg font-semibold">Stream Analyser</h2>
            <p className="text-sm">Coming soon.</p>
          </div>
        )}

        <Link
          href="/ptcg-binders"
          className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-6 transition hover:shadow-md dark:border-neutral-800"
        >
          <h2 className="text-lg font-semibold">Pokédex Binder</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Track Pokémon TCG binder completion.
          </p>
        </Link>
      </div>
    </div>
  );
}
