import type { ContentItem } from "@/lib/content-types";
import ContentGrid from "@/components/content/ContentGrid";
import EmptyState from "@/components/ui/EmptyState";

interface ContentTeaserProps {
  items: ContentItem[];
  failed: boolean;
}

/**
 * Home must never fail to render because an API is down (spec §4.1).
 * `failed` is true only when both content sources threw; in that case we
 * still render the section shell with an EmptyState rather than nothing.
 */
export default function ContentTeaser({ items, failed }: ContentTeaserProps) {
  return (
    <section className="py-8">
      <h2 className="mb-4 text-xl font-semibold">Latest Content</h2>
      {failed || items.length === 0 ? (
        <EmptyState message="Content loading — check back soon." />
      ) : (
        <ContentGrid items={items} />
      )}
    </section>
  );
}
