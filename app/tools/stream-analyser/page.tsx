import type { Metadata } from "next";
import { siteConfig } from "@/data/site-config";
import { StreamAnalyser } from "./components/StreamAnalyser";

export const metadata: Metadata = {
  title: `Stream Analyser — ${siteConfig.brandName}`,
};

export default function StreamAnalyserPage() {
  return (
    <div className="flex flex-col gap-6 py-10">
      <div>
        <h1 className="text-3xl font-bold">Stream Analyser</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Analyse a Twitch VOD&apos;s chat, audio, and stream quality — no sign-in required.
        </p>
      </div>
      <StreamAnalyser />
    </div>
  );
}
