import type { Metadata } from "next";
import { siteConfig } from "@/data/site-config";

export const metadata: Metadata = {
  title: `About — ${siteConfig.brandName}`,
};

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-10 py-10">
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">About</h1>
        {siteConfig.aboutBio.map((para, i) => (
          <p key={i} className="text-neutral-700 dark:text-neutral-300">
            {para}
          </p>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Brand Story</h2>
        {siteConfig.brandStory.map((para, i) => (
          <p key={i} className="text-neutral-700 dark:text-neutral-300">
            {para}
          </p>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Platforms</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="py-2 pr-4 font-medium">Platform</th>
                <th className="py-2 pr-4 font-medium">Handle</th>
                <th className="py-2 font-medium">Link</th>
              </tr>
            </thead>
            <tbody>
              {siteConfig.platformLinks.map((link) => (
                <tr key={link.platform} className="border-b border-neutral-100 dark:border-neutral-900">
                  <td className="py-2 pr-4">{link.platform}</td>
                  <td className="py-2 pr-4">{link.handle}</td>
                  <td className="py-2">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
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
        <h2 className="text-xl font-semibold">Streaming Schedule (SGT)</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="py-2 pr-4 font-medium">Day</th>
                <th className="py-2 pr-4 font-medium">Time (SGT)</th>
                <th className="py-2 font-medium">What</th>
              </tr>
            </thead>
            <tbody>
              {siteConfig.schedule.map((row) => (
                <tr key={row.day} className="border-b border-neutral-100 dark:border-neutral-900">
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
