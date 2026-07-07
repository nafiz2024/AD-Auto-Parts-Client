import { cn } from "@/lib/utils/cn";

export function Checkbox({ className, ...props }) {
  return (
    <input
      type="checkbox"
      className={cn(
        "size-4 rounded border-border text-brand-red focus:ring-brand-red/20",
        className,
      )}
      {...props}
    />
  );
}
