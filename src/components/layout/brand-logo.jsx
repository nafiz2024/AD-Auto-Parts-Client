import Link from "next/link";
import { APP_NAME } from "@/config/env";
import { cn } from "@/lib/utils/cn";

export function BrandLogo({ href = "/", compact = false, className = "" }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-3", className)}>
      <div className="relative flex size-12 items-center justify-center rounded-full border-[6px] border-brand-navy bg-white text-brand-navy shadow-sm">
        <span className="text-base font-black tracking-tight">AD</span>
        <span className="absolute inset-block-start-1 inset-inline-end-1 h-2.5 w-7 rotate-[-25deg] rounded-full bg-brand-red" />
      </div>
      {!compact ? (
        <div className="leading-none">
          <p className="text-2xl font-black tracking-tight text-brand-navy">
            AD Auto <span className="text-brand-red">Parts</span>
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Quality parts, trusted service
          </p>
        </div>
      ) : (
        <span className="sr-only">{APP_NAME}</span>
      )}
    </Link>
  );
}
