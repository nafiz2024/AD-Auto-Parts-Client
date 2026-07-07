import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

export function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-12 w-full appearance-none rounded-2xl border border-border bg-white px-4 pe-11 text-sm text-foreground shadow-sm outline-none transition focus:border-brand-red focus:ring-4 focus:ring-brand-red/10",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute inset-block-start-1/2 inset-inline-end-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
