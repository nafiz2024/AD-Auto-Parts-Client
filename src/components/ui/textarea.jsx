import { cn } from "@/lib/utils/cn";

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-brand-red focus:ring-4 focus:ring-brand-red/10",
        className,
      )}
      {...props}
    />
  );
}
