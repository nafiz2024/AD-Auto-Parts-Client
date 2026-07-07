import { cn } from "@/lib/utils/cn";

export function Label({ className, ...props }) {
  return (
    <label
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    />
  );
}
