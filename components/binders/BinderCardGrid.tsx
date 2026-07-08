import type { BinderSection } from "@/lib/binders";
import { computeSectionCompletion } from "@/lib/binders";
import CompletionBar from "./CompletionBar";
import CardSlot from "./CardSlot";
import EmptyState from "@/components/ui/EmptyState";

interface BinderCardGridProps {
  sections: BinderSection[];
}

export default function BinderCardGrid({ sections }: BinderCardGridProps) {
  if (sections.length === 0) {
    return <EmptyState message="This binder has no sections yet." />;
  }

  return (
    <div className="flex flex-col gap-10">
      {sections.map((section) => (
        <div key={section.name} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">{section.name}</h2>
            <CompletionBar completion={computeSectionCompletion(section)} />
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
            {section.slots.map((slot) => (
              <CardSlot key={slot.slotId} slot={slot} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
