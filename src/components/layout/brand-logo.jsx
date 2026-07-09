"use client";

import Image from "next/image";
import Link from "next/link";
import { APP_NAME } from "@/config/env";
import { cn } from "@/lib/utils/cn";

export function BrandLogo({ href = "/", compact = false, className = "" }) {
  return (
    <Link href={href} className={cn("inline-flex items-center", className)}>
      <div className="relative">
        <Image
          src="/ad-auto-parts-wordmark-removebg-preview.png"
          alt={APP_NAME}
          width={960}
          height={244}
          className={cn(
            "w-auto object-contain",
            compact ? "h-8 sm:h-9" : "h-10 sm:h-11 lg:h-12",
          )}
          priority
        />
      </div>
      <span className="sr-only">{APP_NAME}</span>
    </Link>
  );
}
