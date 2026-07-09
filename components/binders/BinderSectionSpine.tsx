import Link from "next/link";
import type { BinderSection, BinderCompletion } from "@/lib/binders";
import { sectionNameToSlug } from "@/lib/binders";
import { getSpineScheme } from "./sectionSpineColors";
import CompletionBar from "./CompletionBar";

interface BinderSectionSpineProps {
  binderId: string; // for the URL (e.g. "pokedex")
  section: BinderSection;
  completion: BinderCompletion;
}

/**
 * One shelf unit — a clickable spine for a single section. Some generation
 * spine blocks are near-white (pearl/white/diamond/crystal), so every band
 * gets a defined outer border and the label sits on a dark scrim to stay
 * legible against a light page background regardless of block color.
 */
export default function BinderSectionSpine({
  binderId,
  section,
  completion,
}: BinderSectionSpineProps) {
  const scheme = getSpineScheme(section.name);

  return (
    <Link
      href={`/ptcg-binders/${binderId}/${sectionNameToSlug(section.name)}`}
      className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-5 transition hover:shadow-md dark:border-neutral-800"
    >
      <div className="relative flex h-16 overflow-hidden rounded border border-neutral-300 dark:border-neutral-700">
        {scheme.kind === "blocks" ? (
          scheme.blocks.map((color, index) => (
            <div
              key={index}
              className="h-full flex-1"
              style={{ backgroundColor: color }}
            />
          ))
        ) : (
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `linear-gradient(135deg, ${scheme.from}, ${scheme.to})`,
            }}
          />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-black/30 px-2 py-1">
          <span className="text-sm font-semibold text-white">{section.name}</span>
        </div>
      </div>
      <CompletionBar completion={completion} />
    </Link>
  );
}
