"use client";

import Image from "next/image";
import Link from "next/link";
import { APP_NAME } from "@/config/env";
import { cn } from "@/lib/utils/cn";

export function BrandLogo({ href = "/", compact = false, className = "" }) {
  return (
    <Link href={href} className={cn("inline-flex items-center", className)}>
      {compact ? (
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm">
          <Image
            src="/ad-auto-parts-logo.png"
            alt={APP_NAME}
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
            priority
          />
        </div>
      ) : (
        <div className="relative">
          <Image
            src="/ad-auto-parts-wordmark.png"
            alt={APP_NAME}
            width={420}
            height={120}
            className="h-auto w-[170px] object-contain sm:w-[220px] lg:w-[260px]"
            priority
          />
        </div>
      )}
      <span className="sr-only">{APP_NAME}</span>
    </Link>
  );
}
