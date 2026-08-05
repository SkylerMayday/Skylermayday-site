import type { Metadata } from "next";
import { siteConfig } from "@/data/site-config";

export const metadata: Metadata = {
  title: `About — ${siteConfig.brandName}`,
};

export default function AboutPage() {
  return (
    // Section rhythm normalized to 64px mobile / 96px desktop (design-brief.md
    // §4.5) — was py-10 (40px), a second rhythm competing with the homepage's.
    <div className="flex flex-col gap-10 py-16 sm:py-24">
      <section className="flex flex-col gap-4">
        <h1 className="text-balance text-[40px] leading-[0.98] font-black tracking-[-0.03em] sm:text-[64px]">
          About
        </h1>
        {/* `prose-block` (globals.css) is RISK 1's MANDATORY body mitigation:
            17px / 1.65 / ~68ch measure. This page is the one the brief names
            by name as the risk case for a single geometric sans, and the
            first pass shipped it at 16px/1.5 across an 882px measure — the
            mitigation had been applied only to Hero's 2-line blurb, which was
            never at risk. */}
        {siteConfig.aboutBio.map((para, i) => (
          <p key={i} className="prose-block text-fg-muted">
            {para}
          </p>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-balance text-[28px] leading-[1.15] font-bold tracking-[-0.02em] sm:text-[36px]">
          Brand Story
        </h2>
        {siteConfig.brandStory.map((para, i) => (
          <p key={i} className="prose-block text-fg-muted">
            {para}
          </p>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-balance text-[28px] leading-[1.15] font-bold tracking-[-0.02em] sm:text-[36px]">
          Platforms
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-4 font-medium">Platform</th>
                <th className="py-2 pr-4 font-medium">Handle</th>
                <th className="py-2 font-medium">Link</th>
              </tr>
            </thead>
            <tbody>
              {siteConfig.platformLinks.map((link) => (
                <tr key={link.platform} className="border-b border-border">
                  <td className="py-2 pr-4">{link.platform}</td>
                  <td className="py-2 pr-4">{link.handle}</td>
                  <td className="py-2">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-brand-strong transition-colors duration-150 ease-out hover:underline hover:underline-offset-[3px] dark:text-brand-soft"
                    >
                      Visit
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-balance text-[28px] leading-[1.15] font-bold tracking-[-0.02em] sm:text-[36px]">
          Streaming Schedule (SGT)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-4 font-medium">Day</th>
                <th className="py-2 pr-4 font-medium">Time (SGT)</th>
                <th className="py-2 font-medium">What</th>
              </tr>
            </thead>
            <tbody>
              {siteConfig.schedule.map((row) => (
                <tr key={row.day} className="border-b border-border">
                  <td className="py-2 pr-4">{row.day}</td>
                  <td className="py-2 pr-4">{row.time}</td>
                  <td className="py-2">{row.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
