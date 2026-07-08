import { siteConfig } from "@/data/site-config";

export default function Hero() {
  return (
    <section className="flex flex-col items-start gap-4 py-12 sm:py-20">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
        {siteConfig.brandName}
      </h1>
      <p className="max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
        {siteConfig.tagline}
      </p>
      <p className="max-w-xl text-neutral-500 dark:text-neutral-500">
        {siteConfig.heroBlurb}
      </p>
    </section>
  );
}
