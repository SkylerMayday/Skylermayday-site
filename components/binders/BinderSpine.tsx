import Link from "next/link";
import type { Binder, BinderCompletion } from "@/lib/binders";
import CompletionBar from "./CompletionBar";

interface BinderSpineProps {
  binder: Binder;
  completion: BinderCompletion;
}

export default function BinderSpine({ binder, completion }: BinderSpineProps) {
  return (
    <Link
      href={`/ptcg-binders/${binder.id}`}
      className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-5 transition hover:shadow-md dark:border-neutral-800"
    >
      <h3 className="text-lg font-semibold">{binder.name}</h3>
      <CompletionBar completion={completion} />
    </Link>
  );
}
