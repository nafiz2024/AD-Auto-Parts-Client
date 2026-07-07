import { AlertTriangleIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

const variants = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
};

export function Alert({ className, variant = "info", title, children }) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-3xl border px-4 py-4 shadow-sm",
        variants[variant],
        className,
      )}
      role="alert"
    >
      <AlertTriangleIcon className="mt-0.5 shrink-0" />
      <div className="space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className="text-sm leading-6">{children}</div>
      </div>
    </div>
  );
}
