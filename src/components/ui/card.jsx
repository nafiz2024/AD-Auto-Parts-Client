import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn("rounded-3xl border border-border/80 bg-card p-6 shadow-soft", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("mb-5 space-y-1.5", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn("text-xl font-semibold text-foreground", className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return (
    <p className={cn("text-sm leading-6 text-muted-foreground", className)} {...props} />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn("space-y-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return <div className={cn("mt-6 flex flex-wrap gap-3", className)} {...props} />;
}
