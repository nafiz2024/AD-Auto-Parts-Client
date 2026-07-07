import { cn } from "@/lib/utils/cn";

const variants = {
  success: "bg-success/10 text-success",
  info: "bg-blue-500/10 text-blue-600",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
  neutral: "bg-muted text-foreground",
};

export function Badge({ className, variant = "neutral", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
