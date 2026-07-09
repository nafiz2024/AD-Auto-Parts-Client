import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }) {
  const isInvalid = props["aria-invalid"] === true || props["aria-invalid"] === "true";

  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm leading-5 text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-brand-red focus:ring-4 focus:ring-brand-red/10",
        isInvalid && "border-error focus:border-error focus:ring-error/10",
        className,
      )}
      {...props}
    />
  );
}
