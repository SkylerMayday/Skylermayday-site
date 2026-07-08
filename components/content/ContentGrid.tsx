import type { ContentItem } from "@/lib/content-types";
import ContentCard from "./ContentCard";
import EmptyState from "@/components/ui/EmptyState";

interface ContentGridProps {
  items: ContentItem[];
  emptyMessage?: string;
}

export default function ContentGrid({
  items,
  emptyMessage = "Nothing to show here yet.",
}: ContentGridProps) {
  if (items.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ContentCard key={`${item.platform}-${item.id}`} item={item} />
      ))}
    </div>
  );
}
