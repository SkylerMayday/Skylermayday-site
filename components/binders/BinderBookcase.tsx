import type { Binder } from "@/lib/binders";
import { computeCompletion } from "@/lib/binders";
import BinderSpine from "./BinderSpine";
import EmptyState from "@/components/ui/EmptyState";

interface BinderBookcaseProps {
  binders: Binder[];
}

/**
 * Grid designed for N binders — currently renders just "pokedex", but
 * grows automatically as more binders appear in binder.json (P0
 * acceptance #6). No hardcoded binder count/layout here.
 */
export default function BinderBookcase({ binders }: BinderBookcaseProps) {
  if (binders.length === 0) {
    return <EmptyState message="No binders published yet." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {binders.map((binder) => (
        <BinderSpine key={binder.id} binder={binder} completion={computeCompletion(binder)} />
      ))}
    </div>
  );
}
