import { cn } from "@/lib/utils/cn";

export function Spinner({ className }) {
  return (
    <span
      className={cn(
        "inline-block size-5 animate-spin rounded-full border-2 border-brand-red/20 border-t-brand-red",
        className,
      )}
      aria-hidden="true"
    />
  );
}
