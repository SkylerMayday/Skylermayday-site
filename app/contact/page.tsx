import type { Metadata } from "next";
import { Suspense } from "react";
import ContactForm from "@/components/contact/ContactForm";
import { siteConfig } from "@/data/site-config";

export const metadata: Metadata = {
  title: `Contact — ${siteConfig.brandName}`,
};

export default function ContactPage() {
  return (
    <div className="flex flex-col gap-8 py-10">
      <h1 className="text-3xl font-bold">Contact</h1>

      <Suspense fallback={null}>
        <ContactForm />
      </Suspense>

      <div className="flex flex-col gap-3 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <h2 className="text-lg font-semibold">Other ways to reach me</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          {siteConfig.platformLinks.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              {link.platform}
            </a>
          ))}
          {siteConfig.discordInviteUrl && (
            <a
              href={siteConfig.discordInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Discord
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
