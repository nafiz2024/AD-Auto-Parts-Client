import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

export function Select({ className, children, ...props }) {
  const isInvalid = props["aria-invalid"] === true || props["aria-invalid"] === "true";

  return (
    <div className="relative">
      <select
        className={cn(
          "h-12 w-full appearance-none rounded-2xl border border-border bg-white ps-4 pe-14 text-sm leading-5 text-foreground shadow-sm outline-none transition focus:border-brand-red focus:ring-4 focus:ring-brand-red/10",
          isInvalid && "border-error focus:border-error focus:ring-error/10",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 inset-inline-end-0 flex w-14 items-center justify-center text-muted-foreground">
        <ChevronDownIcon className="size-4" />
      </span>
    </div>
  );
}
