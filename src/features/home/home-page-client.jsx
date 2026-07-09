"use client";

import Link from "next/link";
import { CompatibilityFinder } from "@/features/home/compatibility-finder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ArrowRightIcon,
  BagIcon,
  BoxIcon,
  HeartIcon,
  HomeIcon,
  MessageCircleIcon,
  RefreshCcwIcon,
  SearchIcon,
  ShieldIcon,
  ShoppingCartIcon,
  UserIcon,
  WhatsappIcon,
} from "@/components/ui/icons";
import { PriceDisplay } from "@/components/ui/price-display";
import { SectionHeader } from "@/components/ui/section-header";
import { routes } from "@/constants/routes";
import { useLanguage } from "@/hooks/use-language";
import { buildQueryString } from "@/lib/api/query";
import { DEFAULT_SUPPORT_DETAILS, getWhatsappHref } from "@/features/support/support-api";

const whyChooseUsItems = [
  { titleKey: "inspectedParts", descriptionKey: "everyListedPartChecked", icon: ShieldIcon },
  { titleKey: "clearConditionDetails", descriptionKey: "conditionNotesTransparent", icon: BoxIcon },
  { titleKey: "vehicleCompatibilitySupport", descriptionKey: "confirmFitmentBeforeBuyNow", icon: UserIcon },
  { titleKey: "fastDeliveryAcrossSa", descriptionKey: "deliverySupportSaudiArabia", icon: HomeIcon },
  { titleKey: "safePaymentOptions", descriptionKey: "supportedPaymentsWithoutOverstating", icon: ShoppingCartIcon },
];

const howItWorksItems = [
  { labelKey: "searchYourRequiredPart", descriptionKey: "howItWorksStepOneDescription" },
  { labelKey: "checkCompatibility", descriptionKey: "howItWorksStepTwoDescription" },
  { labelKey: "buyNow", descriptionKey: "howItWorksStepThreeDescription" },
  { labelKey: "receiveTheProduct", descriptionKey: "howItWorksStepFourDescription" },
];

function PreviewBadge() {
  const { t } = useLanguage();

  return (
    <Badge variant="warning" className="bg-warning/10 text-warning">
      {t("previewContent")}
    </Badge>
  );
}

function HeroVisual() {
  const { t } = useLanguage();

  return (
    <div className="relative flex min-h-[420px] items-end justify-center overflow-hidden rounded-[2.5rem] bg-[radial-gradient(circle_at_top,#ffffff_0%,#eef3fb_58%,#dde7f6_100%)] p-6 shadow-soft">
      <div className="absolute inset-inline-start-8 inset-block-start-8 h-28 w-28 rounded-full bg-brand-red/8 blur-xl" />
      <div className="absolute inset-inline-end-10 inset-block-start-10 h-36 w-36 rounded-full bg-brand-navy/8 blur-xl" />
      <div className="absolute inset-inline-start-10 inset-block-end-12 h-48 w-48 rounded-full border border-border/70 bg-white/70" />
      <div className="absolute inset-inline-end-8 inset-block-end-8 grid gap-4 sm:w-56">
        <div className="rounded-[2rem] border border-border/80 bg-white/90 p-4 shadow-soft">
          <p className="text-sm font-semibold text-foreground">{t("inspectedAndGraded")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("usedReconditionedClearNotes")}</p>
        </div>
        <div className="rounded-[2rem] border border-border/80 bg-brand-navy p-4 text-white shadow-soft">
          <p className="text-sm font-semibold">{t("buyNowReady")}</p>
          <p className="mt-1 text-sm text-white/70">{t("singleItemOrderingFlowPrepared")}</p>
        </div>
      </div>
      <div className="relative z-10 flex w-full max-w-[520px] items-end justify-center gap-4 sm:gap-6">
        <div className="h-56 w-32 rounded-[2.5rem] border-[10px] border-slate-800 bg-[linear-gradient(180deg,#1f2937,#111827)] shadow-[0_28px_50px_rgba(15,23,42,0.24)] sm:h-64 sm:w-36" />
        <div className="h-72 w-40 rounded-[2.8rem] border-[12px] border-slate-800 bg-[linear-gradient(180deg,#cbd5e1,#64748b_45%,#0f172a)] shadow-[0_36px_60px_rgba(15,23,42,0.25)] sm:h-80 sm:w-44" />
        <div className="relative h-40 w-40 rounded-full border-[12px] border-slate-700 bg-[radial-gradient(circle,#f8fafc_0%,#d1d5db_58%,#6b7280_100%)] shadow-[0_20px_45px_rgba(15,23,42,0.22)] sm:h-48 sm:w-48">
          <div className="absolute inset-6 rounded-full border-[10px] border-slate-100" />
          <div className="absolute inset-0 m-auto h-16 w-10 rounded-full bg-brand-red shadow-[0_0_0_8px_rgba(239,68,68,0.12)] sm:h-20 sm:w-12" />
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="grid items-center gap-10 py-10 lg:grid-cols-[1.02fr_0.98fr] lg:py-14">
      <div className="space-y-7">
        <Badge variant="warning" className="w-fit bg-warning/10 px-4 py-2 text-warning">
          {t("trustedUsedAutoParts")}
        </Badge>
        <div className="space-y-4">
          <h1 className="max-w-2xl text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            {t("reliableUsedAutoPartsForYourVehicle")}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            {t("inspectedUsedPartsSubtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={routes.public.products}>
            <Button size="lg">
              {t("shopAutoParts")}
              <ArrowRightIcon className="size-4" />
            </Button>
          </Link>
          <Link href={routes.public.compatibility}>
            <Button size="lg" variant="outline">
              <SearchIcon className="size-4" />
              {t("searchByVehicle")}
            </Button>
          </Link>
        </div>
        <div className="flex flex-wrap gap-6 border-t border-border pt-4">
          <div className="flex items-center gap-3 text-sm font-medium text-foreground">
            <div className="rounded-full bg-brand-navy/5 p-2 text-brand-navy">
              <ShieldIcon className="size-5" />
            </div>
            {t("inspectedParts")}
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-foreground">
            <div className="rounded-full bg-brand-navy/5 p-2 text-brand-navy">
              <RefreshCcwIcon className="size-5" />
            </div>
            {t("nationwideDelivery")}
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-foreground">
            <div className="rounded-full bg-brand-navy/5 p-2 text-brand-navy">
              <MessageCircleIcon className="size-5" />
            </div>
            {t("customerSupport")}
          </div>
        </div>
      </div>
      <HeroVisual />
    </section>
  );
}

function CategoryCard({ category }) {
  const { t, getLocalizedField } = useLanguage();
  const localizedName = getLocalizedField(category, "name") || category.name;

  return (
    <Link
      href={routes.public.categoryDetail(category.slug ?? category.id)}
      className={`group rounded-[2rem] border border-border bg-gradient-to-br ${category.accent} p-5 shadow-soft transition hover:-translate-y-1`}
    >
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-white/80 p-3 text-brand-navy">
          <BoxIcon className="size-7" />
        </div>
        <ArrowRightIcon className="size-4 text-muted-foreground transition group-hover:text-brand-red" />
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-foreground">{localizedName}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {category.count ? t("listedPartsCount", { count: category.count }) : t("compatiblePartsPreview")}
        </p>
      </div>
    </Link>
  );
}

function ProductCard({ product, buyNowHref }) {
  const { t, getLocalizedField } = useLanguage();
  const localizedName = getLocalizedField(product, "name") || product.name;
  const stockVariant =
    product.stockLabel === "In Stock"
      ? "success"
      : product.stockLabel === "Limited Stock"
        ? "warning"
        : "error";
  const conditionVariant = product.condition === "Reconditioned" ? "warning" : "info";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-border bg-white shadow-soft">
      <div className="relative border-b border-border bg-[radial-gradient(circle_at_top,#ffffff_0%,#eef4fb_65%,#e2e8f0_100%)] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant={conditionVariant}>{product.condition}</Badge>
            <Badge variant={stockVariant}>{product.stockLabel}</Badge>
          </div>
          <button
            type="button"
            className="rounded-full border border-border bg-white/90 p-2 text-muted-foreground transition hover:text-brand-red"
            aria-label={t("wishlist")}
          >
            <HeartIcon className="size-4" />
          </button>
        </div>
        <div className="mt-6 flex h-48 items-center justify-center sm:h-52">
          <div className="relative h-28 w-40 rounded-[2rem] border border-border bg-white shadow-soft">
            <div className="absolute inset-4 rounded-[1.5rem] bg-[linear-gradient(135deg,#0f172a,#64748b)]" />
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-2">
          <Link
            href={routes.public.productDetail(product.slug)}
            className="line-clamp-2 block text-xl font-semibold text-foreground transition hover:text-brand-red"
          >
            {localizedName}
          </Link>
          {product.vehicleSummary ? <p className="text-sm text-muted-foreground">{product.vehicleSummary}</p> : null}
          {product.identifier ? <p className="line-clamp-1 text-sm text-muted-foreground">{product.identifier}</p> : null}
        </div>
        <div className="flex items-end gap-3">
          <PriceDisplay amountMinor={product.priceMinor} className="text-2xl" />
          {product.compareAtMinor ? (
            <span className="text-sm text-muted-foreground line-through">
              <PriceDisplay amountMinor={product.compareAtMinor} className="font-normal text-muted-foreground" />
            </span>
          ) : null}
        </div>
        <div className="mt-auto grid gap-3 sm:grid-cols-2">
          <Link href={buyNowHref} className="flex">
            <Button className="w-full whitespace-nowrap px-3 text-xs sm:px-4 sm:text-sm">
              <BagIcon className="size-4 shrink-0" />
              {t("buyNow")}
            </Button>
          </Link>
          <Link href={routes.public.productDetail(product.slug)} className="flex">
            <Button variant="outline" className="w-full whitespace-nowrap px-3 text-xs sm:px-4 sm:text-sm">
              {t("viewDetails")}
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}

function BrandCard({ brand }) {
  const { getLocalizedField } = useLanguage();
  const localizedName = getLocalizedField(brand, "name") || brand.name;
  const initials = localizedName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      href={`${routes.public.products}${buildQueryString({ brand: brand.slug ?? brand.id })}`}
      className="group flex flex-col items-center rounded-[1.75rem] border border-border bg-white px-4 py-5 text-center shadow-soft transition hover:-translate-y-1"
    >
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-lg font-semibold text-brand-navy">
        {initials}
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">{localizedName}</p>
    </Link>
  );
}

function TestimonialsSection({ testimonials }) {
  const { t } = useLanguage();

  if (testimonials.items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <SectionHeader
        title={t("customerReviews")}
        description={t("customerReviewsDescription")}
        action={<PreviewBadge />}
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {testimonials.items.map((review) => (
          <Card key={review.id} className="h-full">
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{review.name}</p>
                  <p className="text-sm text-muted-foreground">{review.purchase}</p>
                </div>
                <p className="text-warning">★★★★★</p>
              </div>
              <p className="text-sm leading-7 text-muted-foreground">{review.quote}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function HelpCtaSection() {
  const { t } = useLanguage();
  const supportPhone = DEFAULT_SUPPORT_DETAILS.whatsapp;
  const whatsappHref = getWhatsappHref(
    supportPhone,
    "Hello, I need help finding the right part for my vehicle.",
  );

  return (
    <section className="rounded-[2.5rem] bg-[linear-gradient(135deg,#0f172a,#13213c)] p-8 text-white shadow-soft sm:p-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <h2 className="text-3xl font-semibold">{t("needHelpFindingTheRightPart")}</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-white/70">
            {t("needHelpFindingRightPartDescription")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t("chatOnWhatsapp")} ${supportPhone}`}
            className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-[#25d366] px-6 py-3 font-semibold text-white transition hover:brightness-95"
          >
            <WhatsappIcon className="size-5 shrink-0" />
            <span>{t("chatOnWhatsapp")}</span>
          </a>
          <a
            href={`tel:${supportPhone.replace(/\D/g, "")}`}
            className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white px-6 py-3 font-semibold text-brand-navy transition hover:bg-slate-100"
          >
            <MessageCircleIcon className="size-5 shrink-0" />
            <span>{t("callUs")}</span>
          </a>
        </div>
      </div>
    </section>
  );
}

function WhyChooseUsSection() {
  const { t } = useLanguage();

  return (
    <section className="space-y-6">
      <SectionHeader title={t("whyChooseUs")} description={t("whyChooseUsDescription")} />
      <div className="grid gap-4 lg:grid-cols-5">
        {whyChooseUsItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.titleKey} className="h-full">
              <CardContent className="space-y-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-navy/5 text-brand-navy">
                  <Icon className="size-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">{t(item.titleKey)}</h3>
                  <p className="text-sm leading-7 text-muted-foreground">{t(item.descriptionKey)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const { t } = useLanguage();

  return (
    <section className="space-y-6">
      <SectionHeader title={t("howItWorks")} description={t("howItWorksDescription")} />
      <div className="grid gap-4 lg:grid-cols-4">
        {howItWorksItems.map((item, index) => (
          <Card key={item.labelKey} className="relative h-full">
            <CardContent className="grid items-center gap-4 sm:grid-cols-[3.5rem_minmax(0,1fr)]">
              <div className="flex justify-center sm:self-stretch sm:items-center">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-red text-sm font-semibold text-white">
                  {index + 1}
                </div>
              </div>
              <div className="text-center sm:text-start">
                <h3 className="text-lg font-semibold text-foreground">{t(item.labelKey)}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{t(item.descriptionKey)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function SourceAction({ source }) {
  return source === "preview" ? <PreviewBadge /> : null;
}

function CategoriesSection({ categories }) {
  const { t } = useLanguage();

  return (
    <section className="space-y-6">
      <SectionHeader
        title={t("shopByCategory")}
        description={t("shopByCategoryDescription")}
        action={<SourceAction source={categories.source} />}
      />
      {categories.items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.items.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      ) : (
        <EmptyState title={t("shopByCategory")} description={t("shopByCategoryDescription")} />
      )}
    </section>
  );
}

function ProductsSection({ title, description, products, buyNowBaseHref }) {
  return (
    <section className="space-y-6">
      <SectionHeader title={title} description={description} action={<SourceAction source={products.source} />} />
      {products.items.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {products.items.map((product) => (
            <ProductCard
              key={`${title}-${product.id}`}
              product={product}
              buyNowHref={`${buyNowBaseHref}${buildQueryString({
                productId: product.slug ?? product.id,
                qty: 1,
              })}`}
            />
          ))}
        </div>
      ) : (
        <EmptyState title={title} description={description} />
      )}
    </section>
  );
}

function BrandsSection({ vehicleBrands }) {
  const { t } = useLanguage();

  return (
    <section className="space-y-6">
      <SectionHeader
        title={t("shopByVehicleBrand")}
        description={t("shopByVehicleBrandDescription")}
        action={<SourceAction source={vehicleBrands.source} />}
      />
      {vehicleBrands.items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
          {vehicleBrands.items.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t("shopByVehicleBrand")}
          description={t("shopByVehicleBrandDescription")}
        />
      )}
    </section>
  );
}

function RecentlyViewedPlaceholder() {
  const { t } = useLanguage();

  return (
    <section className="space-y-6">
      <SectionHeader
        title={t("recentlyViewed")}
        description={t("recentlyViewedDescription")}
        action={<PreviewBadge />}
      />
      <EmptyState
        icon={RefreshCcwIcon}
        title={t("recentlyViewedItemsWillAppearHere")}
        description={t("recentlyViewedPlaceholderDescription")}
      />
    </section>
  );
}

export function HomePageClient({ data }) {
  const { t } = useLanguage();
  const { categories, featuredProducts, latestProducts, vehicleBrands, testimonials } = data;

  return (
    <div className="overflow-hidden bg-[linear-gradient(180deg,#f8f7f4_0%,#ffffff_28%,#f8f7f4_100%)]">
      <Container className="space-y-14 pb-16">
        <HeroSection />
        <CompatibilityFinder brands={vehicleBrands.items} />
        <CategoriesSection categories={categories} />
        <ProductsSection
          title={t("featuredParts")}
          description={t("featuredPartsDescription")}
          products={featuredProducts}
          buyNowBaseHref={routes.public.checkout}
        />
        <ProductsSection
          title={t("latestArrivals")}
          description={t("latestArrivalsDescription")}
          products={latestProducts}
          buyNowBaseHref={routes.public.checkout}
        />
        <BrandsSection vehicleBrands={vehicleBrands} />
        <HelpCtaSection />
        <WhyChooseUsSection />
        <HowItWorksSection />
        <TestimonialsSection testimonials={testimonials} />
        <RecentlyViewedPlaceholder />
      </Container>
    </div>
  );
}
