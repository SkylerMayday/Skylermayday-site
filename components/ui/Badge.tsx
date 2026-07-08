interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "sold" | "info";
  className?: string;
}

const VARIANT_CLASSES: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900",
  sold: "bg-red-600 text-white",
  info: "bg-blue-600 text-white",
};

export default function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
