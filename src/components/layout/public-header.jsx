"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { apiGet } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
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
import { Input } from "@/components/ui/input";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { routes } from "@/constants/routes";
import { getPublicSupportSettings } from "@/features/support/support-api";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { buildQueryString } from "@/lib/api/query";
import { cn } from "@/lib/utils/cn";

const navLinks = [
  { key: "shop", href: routes.public.products },
  { key: "categories", href: routes.public.categories },
  { key: "brands", href: routes.public.products },
  { key: "featuredParts", href: `${routes.public.products}?sort=featured` },
  { key: "latestArrivals", href: `${routes.public.products}?sort=newest` },
  { key: "contactUs", href: routes.public.contact },
];

const DEFAULT_WHATSAPP_NUMBER = "+966 55 234 5678";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function getEnvelopeItems(result) {
  const data = result?.data ?? result?.raw ?? result ?? null;
  return asArray(data?.items ?? data?.data ?? data);
}

function normalizeCategory(item) {
  return {
    id: item?.id ?? item?._id ?? item?.slug ?? item?.name ?? "category",
    slug: item?.slug ?? item?.id ?? item?._id ?? null,
    name: item?.name ?? item?.title ?? item?.label ?? "Category",
    nameAr: item?.nameAr ?? item?.titleAr ?? item?.labelAr ?? "",
  };
}

function normalizeBrand(item) {
  return {
    id: item?.id ?? item?._id ?? item?.slug ?? item?.name ?? "brand",
    slug: item?.slug ?? item?.id ?? item?._id ?? null,
    name: item?.name ?? item?.label ?? "Brand",
    nameAr: item?.nameAr ?? item?.labelAr ?? "",
  };
}

function getWhatsappHref(number) {
  const digits = String(number ?? "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

function getHeaderMessage(language, key) {
  const messages = {
    wishlistUnavailableTitle: {
      en: "Wishlist",
      ar: "المفضلة",
    },
    wishlistUnavailableDescription: {
      en: "Wishlist is not available yet.",
      ar: "المفضلة غير متاحة بعد.",
    },
    cartUnavailableTitle: {
      en: "Cart",
      ar: "السلة",
    },
    cartUnavailableDescription: {
      en: "Cart is not available. Please use Buy Now for a single item checkout.",
      ar: "السلة غير متاحة. يرجى استخدام اشتر الآن لطلب عنصر واحد.",
    },
    accountMenuLabel: {
      en: "Account menu",
      ar: "قائمة الحساب",
    },
    logoutSuccess: {
      en: "You have been signed out successfully.",
      ar: "تم تسجيل الخروج بنجاح.",
    },
  };

  return messages[key]?.[language] ?? messages[key]?.en ?? "";
}

function SearchBar() {
  const { t } = useLanguage();

  return (
    <form
      action={routes.public.search}
      className="flex w-full max-w-3xl items-center rounded-2xl border border-border bg-white shadow-sm"
    >
      <Input
        type="search"
        name="q"
        aria-label={t("searchParts")}
        placeholder={t("searchByPartNamePlaceholder")}
        className="border-0 shadow-none focus:ring-0"
      />
      <Button type="submit" size="icon" className="m-1 rounded-xl bg-brand-navy hover:bg-brand-navy-soft">
        <SearchIcon />
      </Button>
    </form>
  );
}

function IconAction({ icon: Icon, label, badge, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      className="relative flex min-w-20 cursor-pointer flex-col items-center gap-1 rounded-2xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
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
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [partsBrands, setPartsBrands] = useState([]);
  const [whatsappNumber, setWhatsappNumber] = useState(DEFAULT_WHATSAPP_NUMBER);
  const categoryMenuRef = useRef(null);
  const accountMenuRef = useRef(null);
  const auth = useAuth();
  const toast = useToast();
  const { language, t, getLocalizedField } = useLanguage();

  useEffect(() => {
    let active = true;

    async function loadHeaderData() {
      const [categoriesResult, brandsResult, supportSettings] = await Promise.all([
        apiGet(endpoints.public.categories).catch(() => null),
        apiGet(endpoints.public.partsBrands).catch(() => null),
        getPublicSupportSettings(),
      ]);

      if (!active) {
        return;
      }

      setCategories(getEnvelopeItems(categoriesResult).map(normalizeCategory).slice(0, 6));
      setPartsBrands(getEnvelopeItems(brandsResult).map(normalizeBrand).slice(0, 6));
      setWhatsappNumber(supportSettings?.whatsapp || DEFAULT_WHATSAPP_NUMBER);
    }

    loadHeaderData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event) {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target)) {
        setCategoriesOpen(false);
      }

      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setCategoriesOpen(false);
        setAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function handleLogout() {
    try {
      await auth.logout();
      setAccountOpen(false);
      setMobileOpen(false);
      toast.success(t("logout"), getHeaderMessage(language, "logoutSuccess"));
      window.location.assign(routes.public.home);
    } catch (error) {
      toast.apiError(error, t("logout"));
    }
  }

  function handleWishlistClick() {
    toast.info(
      getHeaderMessage(language, "wishlistUnavailableTitle"),
      getHeaderMessage(language, "wishlistUnavailableDescription"),
    );
  }

  function handleCartClick() {
    toast.info(
      getHeaderMessage(language, "cartUnavailableTitle"),
      getHeaderMessage(language, "cartUnavailableDescription"),
    );
  }

  const desktopNavLinks = navLinks.map((link) =>
    link.key === "brands"
      ? {
          ...link,
          href: partsBrands[0]
            ? `${routes.public.products}${buildQueryString({
                partsBrand: partsBrands[0].slug ?? partsBrands[0].id,
              })}`
            : routes.public.products,
        }
      : link,
  );
  const accountLinks = auth.isAuthenticated
    ? [
        { key: "account", label: t("myAccount"), href: routes.customer.account },
        { key: "orders", label: t("orders"), href: routes.customer.accountOrders },
        { key: "track", label: t("trackOrder"), href: routes.public.trackOrder },
        { key: "profile", label: t("profile"), href: routes.customer.accountProfile },
      ]
    : [
        { key: "account", label: t("myAccount"), href: routes.customer.account },
        { key: "orders", label: t("orders"), href: routes.customer.accountOrders },
        { key: "track", label: t("trackOrder"), href: routes.public.trackOrder },
      ];
  const whatsappHref = getWhatsappHref(whatsappNumber);

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
            <Link href={routes.public.trackOrder} className="transition hover:text-white">
              {t("trackOrder")}
            </Link>
            <Link href={routes.public.contact} className="transition hover:text-white">
              {t("helpCenter")}
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
              aria-label={t("openNavigationMenu")}
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
            <IconAction icon={HeartIcon} label={t("wishlist")} onClick={handleWishlistClick} />
            <IconAction icon={BagIcon} label={t("cart")} badge="0" onClick={handleCartClick} />

            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((current) => !current)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                aria-label={getHeaderMessage(language, "accountMenuLabel")}
                className="flex min-w-28 cursor-pointer items-center gap-2 rounded-2xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
              >
                <UserIcon className="size-5" />
                <div className="text-start">
                  <p className="text-xs text-muted-foreground">{t("myAccount")}</p>
                  <p className="font-medium">{t("account")}</p>
                </div>
                <ChevronDownIcon
                  className={cn("size-4 text-muted-foreground transition", accountOpen && "rotate-180")}
                />
              </button>

              {accountOpen ? (
                <div className="absolute inset-inline-end-0 z-50 mt-3 w-60 rounded-[1.5rem] border border-border bg-white p-2 shadow-soft">
                  <div className="flex flex-col gap-1">
                    {accountLinks.map((link) => (
                      <Link
                        key={link.key}
                        href={link.href}
                        className="rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
                        onClick={() => setAccountOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                    {auth.isAuthenticated ? (
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-2xl px-4 py-3 text-start text-sm font-medium text-foreground transition hover:bg-muted"
                      >
                        {t("logout")}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="pb-4 lg:hidden">
          <SearchBar />
        </div>
      </Container>

      <div className="hidden border-t border-border lg:block">
        <Container className="flex items-center justify-between gap-6 py-4">
          <div className="relative" ref={categoryMenuRef}>
            <button
              type="button"
              onClick={() => setCategoriesOpen((current) => !current)}
              aria-expanded={categoriesOpen}
              aria-haspopup="menu"
              className="inline-flex cursor-pointer items-center gap-3 rounded-2xl px-2 py-2 font-medium text-foreground transition hover:text-brand-red"
            >
              <MenuIcon className="size-5" />
              {t("allCategories")}
              <ChevronDownIcon className={cn("size-4 transition", categoriesOpen && "rotate-180")} />
            </button>

            {categoriesOpen ? (
              <div className="absolute inset-inline-start-0 z-50 mt-3 w-80 rounded-[1.75rem] border border-border bg-white p-3 shadow-soft">
                <div className="grid gap-2">
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <Link
                        key={category.id}
                        href={routes.public.categoryDetail(category.slug ?? category.id)}
                        className="rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
                        onClick={() => setCategoriesOpen(false)}
                      >
                        {getLocalizedField(category, "name") || category.name}
                      </Link>
                    ))
                  ) : (
                    <Link
                      href={routes.public.categories}
                      className="rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
                      onClick={() => setCategoriesOpen(false)}
                    >
                      {t("categories")}
                    </Link>
                  )}

                  <div className="border-t border-border pt-2">
                    <Link
                      href={routes.public.categories}
                      className="rounded-2xl px-4 py-3 text-sm font-medium text-brand-red transition hover:bg-muted"
                      onClick={() => setCategoriesOpen(false)}
                    >
                      {t("shop")}
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <nav className="flex flex-1 items-center justify-center gap-8">
            {desktopNavLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className="text-sm font-medium text-foreground transition hover:text-brand-red"
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>

          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t("whatsapp")} ${whatsappNumber}`}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border px-4 py-2 transition hover:border-[#25d366]/40 hover:bg-muted/40"
            >
              <WhatsappIcon className="text-[#25d366]" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">{t("whatsapp")}</p>
                <p className="text-muted-foreground">{whatsappNumber}</p>
              </div>
            </a>
          ) : null}
        </Container>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-50 bg-brand-navy/45 p-4 transition lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
      >
        <div
          className="ms-auto flex h-full w-full max-w-sm flex-col overflow-y-auto rounded-[2rem] bg-white p-6 shadow-soft"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <BrandLogo compact />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label={t("closeNavigationMenu")}
            >
              <XIcon />
            </button>
          </div>

          <div className="mt-6">
            <SearchBar />
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href={routes.public.categories}
              className="rounded-2xl px-4 py-3 text-base font-medium text-foreground transition hover:bg-muted"
              onClick={() => setMobileOpen(false)}
            >
              {t("allCategories")}
            </Link>
            {desktopNavLinks.map((link) => (
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

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleWishlistClick}
              className="flex items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <HeartIcon className="size-4" />
              {t("wishlist")}
            </button>
            <button
              type="button"
              onClick={handleCartClick}
              className="flex items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <BagIcon className="size-4" />
              {t("cart")}
            </button>
          </div>

          <div className="mt-6 space-y-2">
            {accountLinks.map((link) => (
              <Link
                key={`mobile-${link.key}`}
                href={link.href}
                className="block rounded-2xl px-4 py-3 text-base font-medium text-foreground transition hover:bg-muted"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {auth.isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-2xl px-4 py-3 text-start text-base font-medium text-foreground transition hover:bg-muted"
              >
                {t("logout")}
              </button>
            ) : null}
          </div>

          <div className="mt-auto space-y-4 pt-6">
            <LanguageToggle />
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t("whatsapp")} ${whatsappNumber}`}
                className="block rounded-2xl border border-border p-4 transition hover:bg-muted"
              >
                <p className="font-semibold text-foreground">{t("whatsapp")}</p>
                <p className="text-sm text-muted-foreground">{whatsappNumber}</p>
              </a>
            ) : null}
            {partsBrands.length > 0 ? (
              <div className="rounded-2xl border border-border p-4">
                <p className="mb-3 font-semibold text-foreground">{t("brands")}</p>
                <div className="flex flex-wrap gap-2">
                  {partsBrands.map((brand) => (
                    <Link
                      key={brand.id}
                      href={`${routes.public.products}${buildQueryString({
                        partsBrand: brand.slug ?? brand.id,
                      })}`}
                      className="rounded-xl bg-muted px-3 py-2 text-sm text-foreground transition hover:text-brand-red"
                      onClick={() => setMobileOpen(false)}
                    >
                      {getLocalizedField(brand, "name") || brand.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
