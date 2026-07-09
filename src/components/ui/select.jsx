import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

export function Select({ className, children, ...props }) {
  const { style, ...restProps } = props;
  const isInvalid = props["aria-invalid"] === true || props["aria-invalid"] === "true";

  return (
    <div className="relative">
      <select
        className={cn(
          "h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm leading-5 text-foreground shadow-sm outline-none transition focus:border-brand-red focus:ring-4 focus:ring-brand-red/10",
          isInvalid && "border-error focus:border-error focus:ring-error/10",
          className,
        )}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          backgroundImage: "none",
          paddingInlineStart: "1rem",
          paddingInlineEnd: "3.5rem",
          ...style,
        }}
        {...restProps}
      >
        {children}
      </select>
      <span
        className="pointer-events-none absolute top-1/2 flex size-4 -translate-y-1/2 items-center justify-center text-muted-foreground"
        style={{ insetInlineEnd: "1rem" }}
      >
        <ChevronDownIcon className="size-4" />
      </span>
    </div>
  );
}
