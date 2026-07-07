"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { LanguageToggle } from "@/components/ui/language-toggle";
import {
  BagIcon,
  ChevronDownIcon,
  HeartIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
  WhatsappIcon,
  XIcon,
} from "@/components/ui/icons";
import { BrandLogo } from "@/components/layout/brand-logo";
import { routes } from "@/constants/routes";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils/cn";

const navLinks = [
  { key: "shop", href: routes.public.products },
  { key: "categories", href: routes.public.products },
  { key: "brands", href: routes.public.products },
  { key: "featuredParts", href: routes.public.products },
  { key: "latestArrivals", href: routes.public.products },
  { key: "contactUs", href: routes.public.contact },
];

function SearchBar() {
  return (
    <form action={routes.public.search} className="flex w-full max-w-3xl items-center rounded-2xl border border-border bg-white shadow-sm">
      <Input
        type="search"
        name="q"
        aria-label="Search parts"
        placeholder="Search by part name, OEM number or keyword..."
        className="border-0 shadow-none focus:ring-0"
      />
      <Button type="submit" size="icon" className="m-1 rounded-xl bg-brand-navy hover:bg-brand-navy-soft">
        <SearchIcon />
      </Button>
    </form>
  );
}

function IconLink({ icon: Icon, label, badge }) {
  return (
    <button
      type="button"
      className="relative flex min-w-20 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
    >
      <span className="relative">
        <Icon className="size-5" />
        {badge ? (
          <span className="absolute -inset-block-start-2 -inset-inline-end-2 flex size-5 items-center justify-center rounded-full bg-brand-red text-[10px] font-semibold text-white">
            {badge}
          </span>
        ) : null}
      </span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <header className="sticky inset-block-start-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <div className="hidden bg-brand-navy text-white lg:block">
        <Container className="flex items-center justify-between gap-6 py-2 text-sm">
          <div className="flex flex-wrap items-center gap-6 text-white/90">
            <span>{t("inspectedParts")}</span>
            <span>{t("nationwideDelivery")}</span>
            <span>{t("customerSupport")}</span>
          </div>
          <div className="flex items-center gap-6 text-white/80">
            <Link href={routes.public.search} className="transition hover:text-white">
              Track Order
            </Link>
            <Link href={routes.public.contact} className="transition hover:text-white">
              Help Center
            </Link>
          </div>
        </Container>
      </div>
      <Container>
        <div className="flex items-center justify-between gap-4 py-4 lg:grid lg:grid-cols-[auto_1fr_auto]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-2xl border border-border p-3 text-foreground lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <MenuIcon />
            </button>
            <BrandLogo />
          </div>
          <div className="hidden justify-center lg:flex">
            <SearchBar />
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <LanguageToggle />
            <IconLink icon={HeartIcon} label={t("wishlist")} />
            <IconLink icon={BagIcon} label="Cart" badge="0" />
            <button
              type="button"
              className="flex min-w-28 items-center gap-2 rounded-2xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
            >
              <UserIcon className="size-5" />
              <div className="text-start">
                <p className="text-xs text-muted-foreground">{t("myAccount")}</p>
                <p className="font-medium">{t("account")}</p>
              </div>
              <ChevronDownIcon className="size-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        <div className="pb-4 lg:hidden">
          <SearchBar />
        </div>
      </Container>
      <div className="hidden border-t border-border lg:block">
        <Container className="flex items-center justify-between gap-6 py-4">
          <button
            type="button"
            className="inline-flex items-center gap-3 rounded-2xl px-2 py-2 font-medium text-foreground transition hover:text-brand-red"
          >
            <MenuIcon className="size-5" />
            {t("allCategories")}
          </button>
          <nav className="flex flex-1 items-center justify-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className="text-sm font-medium text-foreground transition hover:text-brand-red"
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 rounded-2xl border border-border px-4 py-2">
            <WhatsappIcon className="text-[#25d366]" />
            <div className="text-sm">
              <p className="font-semibold text-foreground">WhatsApp</p>
              <p className="text-muted-foreground">+966 54 321 6789</p>
            </div>
          </div>
        </Container>
      </div>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-brand-navy/45 p-4 transition lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="ml-auto flex h-full w-full max-w-sm flex-col rounded-[2rem] bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <BrandLogo compact />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Close navigation menu"
            >
              <XIcon />
            </button>
          </div>
          <div className="mt-6">
            <SearchBar />
          </div>
          <div className="mt-6 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className="rounded-2xl px-4 py-3 text-base font-medium text-foreground transition hover:bg-muted"
                onClick={() => setMobileOpen(false)}
              >
                {t(link.key)}
              </Link>
            ))}
          </div>
          <div className="mt-auto space-y-4">
            <LanguageToggle />
            <div className="rounded-2xl border border-border p-4">
              <p className="font-semibold text-foreground">WhatsApp</p>
              <p className="text-sm text-muted-foreground">+966 54 321 6789</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
