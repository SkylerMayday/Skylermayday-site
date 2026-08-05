import type { Metadata } from "next";
import { Suspense } from "react";
import ContactForm from "@/components/contact/ContactForm";
import { siteConfig } from "@/data/site-config";

export const metadata: Metadata = {
  title: `Contact — ${siteConfig.brandName}`,
};

export default function ContactPage() {
  return (
    <div className="flex flex-col gap-8 py-16 sm:py-24">
      <h1 className="text-balance text-[40px] leading-[0.98] font-black tracking-[-0.03em] sm:text-[64px]">
        Contact
      </h1>

      <Suspense fallback={null}>
        <ContactForm />
      </Suspense>

      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="text-balance text-[28px] leading-[1.15] font-bold tracking-[-0.02em] sm:text-[36px]">
          Other ways to reach me
        </h2>
        <div className="flex flex-wrap gap-4 text-sm">
          {siteConfig.platformLinks.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-strong transition-colors duration-150 ease-out hover:underline hover:underline-offset-[3px] dark:text-brand-soft"
            >
              {link.platform}
            </a>
          ))}
          {siteConfig.discordInviteUrl && (
            <a
              href={siteConfig.discordInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-strong transition-colors duration-150 ease-out hover:underline hover:underline-offset-[3px] dark:text-brand-soft"
            >
              Discord
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
