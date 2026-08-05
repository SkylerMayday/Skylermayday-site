import Link from "next/link";

export default function SectionNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center sm:py-24">
      <h1 className="text-balance text-[40px] leading-[0.98] font-black tracking-[-0.03em] sm:text-[64px]">
        Section not found
      </h1>
      <p className="prose-block text-fg-muted">
        This section doesn&apos;t exist or hasn&apos;t been published yet.
      </p>
      <Link
        href="/projects/ptcg-binders"
        className="rounded-lg bg-brand px-4 py-2 font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-strong motion-reduce:transition-none"
      >
        Back to Binders
      </Link>
    </div>
  );
}
