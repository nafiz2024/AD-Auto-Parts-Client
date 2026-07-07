import { cn } from "@/lib/utils/cn";

const variants = {
  primary: "bg-brand-red text-white hover:bg-brand-red-strong focus-visible:ring-brand-red/30",
  secondary: "bg-brand-navy text-white hover:bg-brand-navy-soft focus-visible:ring-brand-navy/30",
  outline: "border border-border bg-white text-foreground hover:bg-muted focus-visible:ring-brand-red/20",
  ghost: "bg-transparent text-foreground hover:bg-muted focus-visible:ring-brand-red/20",
  danger: "bg-error text-white hover:bg-[#dd2626] focus-visible:ring-error/30",
  warning: "bg-warning text-white hover:bg-[#d68700] focus-visible:ring-warning/30",
};

const sizes = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "size-11 justify-center px-0",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
