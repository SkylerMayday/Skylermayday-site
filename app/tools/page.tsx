import type { Metadata } from "next";
import { env } from "@/lib/env";
import { siteConfig } from "@/data/site-config";
import { fetchBotStatus } from "@/lib/discord";

export const metadata: Metadata = {
  title: `Tools — ${siteConfig.brandName}`,
};

export default async function ToolsPage() {
  const streamAnalyserUrl = env.STREAM_ANALYSER_URL;
  const botStatus = await fetchBotStatus();

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

        {/* Discord bot live-status card — the SkylerMayday Discord bot, live in my server. */}
        <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            {botStatus.online && botStatus.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={botStatus.avatarUrl}
                alt="SkylerMayday Discord bot avatar"
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            )}
            <h2 className="text-lg font-semibold">SkylerMayday Discord Bot</h2>
          </div>
          {botStatus.unavailable ? (
            <p className="text-sm text-neutral-400">Status unavailable right now.</p>
          ) : (
            <p className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  botStatus.online ? "bg-green-500" : "bg-neutral-400"
                }`}
                aria-hidden="true"
              />
              {botStatus.online ? "Online" : "Offline"}
            </p>
          )}
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            The SkylerMayday Discord bot, live in my server.
          </p>
        </div>
      </div>
    </div>
  );
}
