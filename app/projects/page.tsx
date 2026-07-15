import type { Metadata } from "next";
import { siteConfig } from "@/data/site-config";
import { discordCommandGroups } from "@/data/discord-commands";
import { fetchBotStatus } from "@/lib/discord";
import ProjectBadge from "@/components/ui/ProjectBadge";
import ProjectCard from "@/components/projects/ProjectCard";
import ProjectIcon from "@/components/projects/ProjectIcon";

export const metadata: Metadata = {
  title: `Projects — ${siteConfig.brandName}`,
};

export default async function ProjectsPage() {
  const botStatus = await fetchBotStatus();

  return (
    <div className="flex flex-col gap-8 py-10">
      <h1 className="text-3xl font-bold">Projects</h1>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Current Projects</h2>
        <div className="grid grid-cols-1 gap-4">
          <ProjectCard
            title="Packs of Noods"
            description="Food IRL stream series with draftpicked — exploring Singapore food spots and opening Pokémon TCG packs at the table. #teamfatnoods."
            badges={["stream-content"]}
            icon="noodles"
            href="/projects/packs-of-noods"
          />

          <ProjectCard
            title="Pokédex Binder"
            description="Android app plus this site's binder showcase tracking the living-Pokédex TCG collection — and my personal collection binders."
            badges={["stream-content", "vibe-coded"]}
            icon="pokedex"
            reverse
            href="/projects/ptcg-binders"
          />

          <ProjectCard
            title="Stream Analyser"
            description="Analyse a VOD's chat, audio, and stream quality."
            badges={["vibe-coded"]}
            icon="waveform"
            href="/projects/stream-analyser"
          />

          {/* Discord bot live-status card — bespoke (live widget), not a ProjectCard. */}
          <div className="flex flex-row-reverse items-start gap-4 rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
            <ProjectIcon variant="discord" />
            <div className="flex flex-1 flex-col gap-2 text-right">
              <div className="flex flex-wrap justify-end gap-1.5">
                <ProjectBadge variant="vibe-coded" />
              </div>
              <div className="flex items-center justify-end gap-3">
                <h3 className="text-lg font-semibold">SkylerMayday Discord Bot</h3>
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
              </div>
              {botStatus.unavailable ? (
                <p className="text-sm text-neutral-400">Status unavailable right now.</p>
              ) : (
                <p className="flex items-center justify-end gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                  {botStatus.online ? "Online" : "Offline"}
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      botStatus.online ? "bg-green-500" : "bg-neutral-400"
                    }`}
                    aria-hidden="true"
                  />
                </p>
              )}
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                The SkylerMayday Discord bot, live in my server.
              </p>
              {botStatus.inviteUrl && (
                <a
                  href={botStatus.inviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center self-end rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  Join the Discord
                </a>
              )}
              <details className="mt-1 text-sm">
                <summary className="cursor-pointer select-none font-medium text-neutral-700 dark:text-neutral-300">
                  What everyone can use
                </summary>
                <dl className="mt-3 flex flex-col gap-3 text-left">
                  {discordCommandGroups.map((g) => (
                    <div key={g.group} className="flex flex-col gap-1">
                      <dt className="font-medium text-neutral-600 dark:text-neutral-400">
                        {g.group}
                      </dt>
                      <dd className="flex flex-col gap-1">
                        {g.note && (
                          <span className="text-neutral-500 dark:text-neutral-400">{g.note}</span>
                        )}
                        {g.commands.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {g.commands.map((c) => (
                              <code
                                key={c}
                                className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                              >
                                {c}
                              </code>
                            ))}
                          </div>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </details>
            </div>
          </div>

          <ProjectCard
            title="MobileStream"
            description="Android app that streams a phone's camera or screen over RTMP and auto-drives OBS scene switching for IRL streams — my replacement for NOALBS."
            badges={["vibe-coded"]}
            icon="mobile-stream"
          />
        </div>
      </section>

      <section id="past" className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Past Projects</h2>
        <div className="grid grid-cols-1 gap-4">
          <ProjectCard
            title="Games Expedition"
            description="Game-showcase channel exploring what makes games worth playing. Ran Nov 2019 – Nov 2024: 72 archived episodes across three shows — Main Show, Space'd Out, and Uncharted — with NeppyNepstar, FinalPhantasia, MooseyMus and crew. Started on Mixer, moved to Twitch, now archived on YouTube."
            badges={["stream-content"]}
            icon="game-controller"
            href="https://www.youtube.com/@GamesExpedition"
            external
            muted
          />
        </div>
      </section>
    </div>
  );
}
