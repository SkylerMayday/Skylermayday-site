interface PlaceholderProps {
  className?: string;
  label?: string;
}

/** Fallback thumbnail shown when a content/shop/card image is missing or fails to load. */
export default function Placeholder({ className = "", label }: PlaceholderProps) {
  return (
    <div
      // --border / --fg-muted rather than raw neutrals — measured 5.98:1
      // light, 6.03:1 dark.
      className={`flex items-center justify-center bg-border text-fg-muted ${className}`}
      role="img"
      aria-label={label ?? "No image available"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="h-8 w-8 opacity-60"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    </div>
  );
}
