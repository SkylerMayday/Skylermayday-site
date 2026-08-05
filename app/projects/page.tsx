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
    <div className="flex flex-col gap-8 py-16 sm:py-24">
      <h1 className="text-balance text-[40px] leading-[0.98] font-black tracking-[-0.03em] sm:text-[64px]">
        Projects
      </h1>

      <section className="flex flex-col gap-4">
        <h2 className="text-balance text-[28px] leading-[1.15] font-bold tracking-[-0.02em] sm:text-[36px]">
          Current Projects
        </h2>
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
          <div className="flex flex-row-reverse items-start gap-4 rounded-lg border border-border p-6">
            <ProjectIcon variant="discord" />
            <div className="flex flex-1 flex-col gap-2 text-right">
              <div className="flex flex-wrap justify-end gap-1.5">
                <ProjectBadge variant="vibe-coded" />
              </div>
              <div className="flex items-center justify-end gap-3">
                <h3 className="text-balance text-[20px] leading-[1.25] font-bold tracking-[-0.01em] sm:text-[22px]">
                  SkylerMayday Discord Bot
                </h3>
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
                  <div className="h-10 w-10 rounded-full bg-border" />
                )}
              </div>
              {botStatus.unavailable ? (
                <p className="text-sm text-fg-muted">Status unavailable right now.</p>
              ) : (
                <p className="flex items-center justify-end gap-2 text-sm text-fg-muted">
                  {botStatus.online ? "Online" : "Offline"}
                  {/* --success (globals.css) is a real named semantic token,
                      not the brand purple and not a raw Tailwind green — it
                      is #1F8A5F, lifted from sectionSpineColors.ts's
                      Generation III block under the same shared-origin rule
                      as --accent and --danger. This dot is a non-text UI
                      indicator, so WCAG 1.4.11's 3:1 floor applies rather
                      than 4.5:1: measured 4.04:1 on the light --bg and
                      4.50:1 on the dark --bg. The offline state uses
                      --border (the site's own hairline token), replacing a
                      raw neutral-400. The state is never colour-only — the
                      word "Online"/"Offline" carries it, and the dot itself
                      is aria-hidden. */}
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      botStatus.online ? "bg-success" : "bg-border"
                    }`}
                    aria-hidden="true"
                  />
                </p>
              )}
              <p className="text-sm text-fg-muted">
                The SkylerMayday Discord bot, live in my server.
              </p>
              {botStatus.inviteUrl && (
                <a
                  href={botStatus.inviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  // bg-brand, not the bg-indigo-600 this shipped with: indigo
                  // is a near-miss against #9146FF, so the project hub was
                  // showing two different purples metres apart, one of which
                  // is the brand. A nearly-right colour reads as a mistake
                  // (Stage 4 verdict, Correction C). White on --brand = 4.64:1
                  // (AA), hover darkens to --brand-strong = 5.81:1.
                  className="inline-flex w-fit items-center self-end rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-strong motion-reduce:transition-none"
                >
                  Join the Discord
                </a>
              )}
              <details className="mt-1 text-sm">
                <summary className="cursor-pointer select-none font-medium text-fg-muted transition-colors duration-150 ease-out hover:text-fg motion-reduce:transition-none">
                  What everyone can use
                </summary>
                <dl className="mt-3 flex flex-col gap-3 text-left">
                  {discordCommandGroups.map((g) => (
                    <div key={g.group} className="flex flex-col gap-1">
                      <dt className="font-medium text-fg">{g.group}</dt>
                      <dd className="flex flex-col gap-1">
                        {g.note && <span className="text-fg-muted">{g.note}</span>}
                        {g.commands.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {g.commands.map((c) => (
                              <code
                                key={c}
                                className="rounded bg-border px-1.5 py-0.5 font-mono text-xs text-fg"
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
        <h2 className="text-balance text-[28px] leading-[1.15] font-bold tracking-[-0.02em] sm:text-[36px]">
          Past Projects
        </h2>
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
