import tiktokEmbeds from "@/data/tiktok-embeds.json";
import EmptyState from "@/components/ui/EmptyState";

interface TikTokEmbed {
  id: string;
  url: string;
  caption: string;
}

const embeds = tiktokEmbeds as TikTokEmbed[];

/**
 * Renders the curated static TikTok embed list via TikTok's blockquote
 * embed format. `embed.js` is loaded once, lazily, via next/script.
 * This section is static (no API call), so it always renders even when
 * every API-backed content source has failed — satisfies "content page
 * is never fully empty" from spec §4.3.
 */
export default function TikTokEmbeds() {
  if (embeds.length === 0) {
    return <EmptyState message="No TikTok videos curated yet." />;
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">TikTok</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {embeds.map((embed) => (
          <blockquote
            key={embed.id}
            className="tiktok-embed rounded-lg border border-neutral-200 p-2 dark:border-neutral-800"
            cite={embed.url}
            data-video-id={embed.id}
          >
            <a href={embed.url} target="_blank" rel="noopener noreferrer">
              {embed.caption}
            </a>
          </blockquote>
        ))}
      </div>
      {/* Lazy, loaded once — TikTok's official embed script hydrates the blockquotes above. */}
      <script async src="https://www.tiktok.com/embed.js" />
    </div>
  );
}
