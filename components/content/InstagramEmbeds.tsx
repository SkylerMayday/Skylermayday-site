import instagramEmbeds from "@/data/instagram-embeds.json";
import EmptyState from "@/components/ui/EmptyState";

interface InstagramEmbed {
  id: string;
  url: string;
  caption: string;
}

const embeds = instagramEmbeds as InstagramEmbed[];

/**
 * Renders the curated static Instagram embed list via Instagram's blockquote
 * embed format. `embed.js` is loaded once, lazily. Static (no API call), so it
 * always renders even when every API-backed content source has failed — same
 * "content page is never fully empty" guarantee as TikTokEmbeds.
 *
 * Instagram has no practical public API for listing a user's posts without
 * Business-API approval — same non-goal constraint as TikTok. Embeds are
 * hand-curated in data/instagram-embeds.json.
 */
export default function InstagramEmbeds() {
  if (embeds.length === 0) {
    return <EmptyState message="No Instagram posts curated yet." />;
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Instagram</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {embeds.map((embed) => (
          <blockquote
            key={embed.id}
            className="instagram-media rounded-lg border border-neutral-200 p-2 dark:border-neutral-800"
            data-instgrm-permalink={embed.url}
            data-instgrm-version="14"
          >
            <a href={embed.url} target="_blank" rel="noopener noreferrer">
              {embed.caption}
            </a>
          </blockquote>
        ))}
      </div>
      {/* Lazy, loaded once — Instagram's official embed script hydrates the blockquotes above. */}
      <script async src="//www.instagram.com/embed.js" />
    </div>
  );
}
