"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

const LOGO_VARIANTS = {
  public: {
    src: "/public_logo.png",
    alt: "AD Auto Parts",
    href: "/",
    width: 1536,
    height: 436,
    sizes: {
      compact: "h-11 sm:h-12",
      default: "h-12 sm:h-14 lg:h-[3.5rem]",
    },
  },
  admin: {
    src: "/admin_logo.png",
    alt: "AD Auto Parts Admin",
    href: "/admin/dashboard",
    width: 869,
    height: 270,
    sizes: {
      compact: "h-10 sm:h-11",
      default: "h-11 sm:h-12 lg:h-14",
    },
  },
};

export function BrandLogo({
  variant = "public",
  href,
  compact = false,
  className = "",
  imageClassName = "",
  priority = true,
}) {
  const config = LOGO_VARIANTS[variant] ?? LOGO_VARIANTS.public;

  return (
    <Link href={href ?? config.href} className={cn("inline-flex items-center", className)}>
      <div className="relative">
        <Image
          src={config.src}
          alt={config.alt}
          width={config.width}
          height={config.height}
          sizes="(max-width: 640px) 180px, (max-width: 1024px) 240px, 320px"
          className={cn(
            "w-auto max-w-full object-contain",
            compact ? config.sizes.compact : config.sizes.default,
            imageClassName,
          )}
          priority={priority}
        />
      </div>
      <span className="sr-only">{config.alt}</span>
    </Link>
  );
}
