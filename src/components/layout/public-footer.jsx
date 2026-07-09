"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Container } from "@/components/ui/container";
import { ShieldIcon, TruckIcon, UsersIcon, WalletIcon } from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import { useLanguage } from "@/hooks/use-language";

const shopLinks = [
  { key: "shopAutoParts", href: routes.public.shop },
  { key: "latestArrivals", href: `${routes.public.shop}?sort=newest` },
  { key: "trackOrder", href: routes.public.trackOrder },
];

const supportLinks = [
  { key: "aboutAdAutoParts", href: routes.public.about },
  { key: "contactUs", href: routes.public.contact },
  { key: "returnPolicy", href: routes.public.returnPolicy },
  { key: "termsAndConditions", href: routes.public.termsAndConditions },
  { key: "privacyPolicy", href: routes.public.privacyPolicy },
];

export function PublicFooter() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-[#f8f7f4]">
      <Container className="grid gap-10 py-14 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1fr]">
        <div className="space-y-4">
          <BrandLogo />
          <p className="max-w-md text-sm leading-7 text-muted-foreground">
            {t("companySupportDescription")}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
            {t("shop")}
          </h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
            {shopLinks.map((link) => (
              <Link key={link.key} href={link.href} className="transition hover:text-brand-red">
                {t(link.key)}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
            {t("support")}
          </h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
            {supportLinks.map((link) => (
              <Link key={link.key} href={link.href} className="transition hover:text-brand-red">
                {t(link.key)}
              </Link>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
            {t("contactUs")}
          </h3>
          <div className="text-sm leading-7 text-muted-foreground">
            <p>{t("saudiArabiaLocation")}</p>
            <p>support@adautoparts.example</p>
            <p>+966 55 234 5678</p>
          </div>
        </div>
      </Container>
      <div className="border-t border-border/80 bg-white">
        <Container className="grid gap-4 py-5 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-brand-navy/5 p-2 text-brand-navy">
              <ShieldIcon className="size-4" />
            </span>
            <span>{t("inspectedParts")}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-brand-navy/5 p-2 text-brand-navy">
              <TruckIcon className="size-4" />
            </span>
            <span>{t("nationwideDelivery")}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-brand-navy/5 p-2 text-brand-navy">
              <WalletIcon className="size-4" />
            </span>
            <span>{t("codAndManualAdvance")}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-brand-navy/5 p-2 text-brand-navy">
              <UsersIcon className="size-4" />
            </span>
            <span>{t("customerSupport")}</span>
          </div>
        </Container>
      </div>
    </footer>
  );
}
