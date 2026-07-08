"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BagIcon,
  BoxIcon,
  FilterIcon,
  GridIcon,
  HeartIcon,
  ListIcon,
  SearchIcon,
  WhatsappIcon,
} from "@/components/ui/icons";
import { PriceDisplay } from "@/components/ui/price-display";
import { Select } from "@/components/ui/select";
import { ProductCardSkeleton } from "@/components/states/loading-states";
import { routes } from "@/constants/routes";
import { useLanguage } from "@/hooks/use-language";
import { buildQueryString } from "@/lib/api/query";

function createQueryObject(filters, overrides = {}) {
  const query = {
    q: filters.q || undefined,
    category: filters.category || undefined,
    brand: filters.brand || undefined,
    model: filters.model || undefined,
    year: filters.year || undefined,
    sort: filters.sort || undefined,
    view: filters.view || undefined,
    page: filters.page > 1 ? filters.page : undefined,
    minPrice: filters.minPrice !== null ? String(filters.minPrice / 100) : undefined,
    maxPrice: filters.maxPrice !== null ? String(filters.maxPrice / 100) : undefined,
    condition: filters.conditions.length > 0 ? filters.conditions : undefined,
    availability: filters.availability.length > 0 ? filters.availability : undefined,
    position: filters.positions.length > 0 ? filters.positions : undefined,
    partsBrand: filters.partsBrands.length > 0 ? filters.partsBrands : undefined,
  };

  return {
    ...query,
    ...overrides,
  };
}

function createHref(basePath, filters, overrides = {}) {
  const query = createQueryObject(filters, overrides);
  const search = buildQueryString(query);
  return `${basePath}${search}`;
}

function hasActiveFilters(filters, mode) {
  return Boolean(
    (mode === "search" ? false : filters.q) ||
      filters.brand ||
      filters.model ||
      filters.year ||
      filters.conditions.length > 0 ||
      filters.availability.length > 0 ||
      filters.positions.length > 0 ||
      filters.partsBrands.length > 0 ||
      filters.minPrice !== null ||
      filters.maxPrice !== null,
  );
}

function HiddenFields({ filters, exclude = [] }) {
  const query = createQueryObject(filters);

  return (
    <>
      {Object.entries(query).flatMap(([key, value]) => {
        if (exclude.includes(key) || value === undefined || value === "") {
          return [];
        }

        if (Array.isArray(value)) {
          return value.map((item) => (
            <input key={`${key}-${item}`} type="hidden" name={key} value={item} />
          ));
        }

        return <input key={key} type="hidden" name={key} value={value} />;
      })}
    </>
  );
}

function PreviewSourceBadge({ source }) {
  const { t } = useLanguage();

  if (source !== "preview") {
    return null;
  }

  return (
    <Badge variant="warning" className="bg-warning/10 text-warning">
      {t("previewFallback")}
    </Badge>
  );
}

function Breadcrumbs({ items }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <div key={item.label} className="flex items-center gap-2">
          {item.href ? (
            <Link href={item.href} className="transition hover:text-brand-red">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
          {index < items.length - 1 ? <span>/</span> : null}
        </div>
      ))}
    </div>
  );
}

function HeroVisual({ mode }) {
  const innerClassName =
    mode === "search"
      ? "h-44 w-80 rounded-[2.25rem] border border-border bg-[linear-gradient(145deg,#0f172a,#475569)]"
      : "h-48 w-80 rounded-[2.5rem] border border-border bg-[linear-gradient(145deg,#dbe4ef,#ffffff)]";

  return (
    <div className="relative flex min-h-[240px] items-end justify-center overflow-hidden rounded-[2.5rem] bg-[radial-gradient(circle_at_top,#ffffff_0%,#eef3fb_55%,#dde7f6_100%)] p-6 shadow-soft">
      <div className="absolute inset-inline-start-8 inset-block-start-8 h-24 w-24 rounded-full bg-brand-red/10 blur-2xl" />
      <div className="absolute inset-inline-end-10 inset-block-start-10 h-28 w-28 rounded-full bg-brand-navy/10 blur-2xl" />
      <div className={innerClassName}>
        <div className="flex h-full items-center justify-center gap-4 p-6">
          <div className="h-28 w-28 rounded-full border-[10px] border-white/70 bg-[radial-gradient(circle,#f8fafc_0%,#d1d5db_60%,#6b7280_100%)] shadow-lg" />
          <div className="space-y-3">
            <div className="h-8 w-36 rounded-full bg-white/75" />
            <div className="h-8 w-28 rounded-full bg-brand-red/75" />
            <div className="h-8 w-24 rounded-full bg-brand-navy/70" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ListingHero({ mode, filters, category, products, suggestedSearches }) {
  const { t, getLocalizedField } = useLanguage();
  const isSearch = mode === "search";
  const isCategory = mode === "category";
  const title = isSearch
    ? filters.q
        ? t("searchResultsFor", { query: filters.q })
      : t("searchTheCatalog")
    : isCategory
      ? getLocalizedField(category, "name") || t("categories")
      : t("shopAutoParts");
  const description = isSearch
    ? filters.q
      ? t("searchResultsDescription", { count: products.resultCount, query: filters.q })
      : t("searchCatalogDescription")
    : isCategory
      ? getLocalizedField(category, "description") || t("categoryDefaultDescription")
      : t("shopAutoPartsDescription");
  const highlight = isCategory
    ? getLocalizedField(category, "highlight") || t("partsAvailable", { count: products.resultCount })
    : t("partsAvailable", { count: products.resultCount });

  return (
    <section className="space-y-6 rounded-[2.75rem] border border-border/80 bg-white p-6 shadow-soft sm:p-8">
      <Breadcrumbs
        items={[
          { label: t("home"), href: routes.public.home },
          isSearch
            ? { label: t("search") }
            : isCategory
              ? { label: t("categories"), href: routes.public.products }
              : { label: t("shop") },
          ...(isCategory && category ? [{ label: getLocalizedField(category, "name") || category.name }] : []),
        ]}
      />
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <PreviewSourceBadge source={products.source} />
          </div>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">{description}</p>
          </div>
          <div className="inline-flex items-center gap-3 rounded-2xl border border-border bg-[#f7fafc] px-4 py-3 text-sm font-semibold text-foreground">
            <BoxIcon className="size-5 text-brand-navy" />
            {highlight}
          </div>
          {isSearch && suggestedSearches.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">{t("suggestedSearches")}</p>
              <div className="flex flex-wrap gap-2">
                {suggestedSearches.map((suggestion) => (
                  <Link
                    key={suggestion}
                    href={createHref(routes.public.search, filters, {
                      q: suggestion,
                      page: undefined,
                    })}
                    className="rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground transition hover:border-brand-red hover:text-brand-red"
                  >
                    {suggestion}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <HeroVisual mode={mode} />
      </div>
      {isCategory && category ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {["Complete Engine", "Cylinder Head", "Engine Mount", "Crankshaft"].map((item) => (
            <div
              key={item}
              className="rounded-[1.5rem] border border-border bg-[#fcfcfd] px-4 py-4 shadow-sm"
            >
              <p className="text-sm font-semibold text-foreground">{item}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("inspectedAndCatalogedParts")}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function FilterSection({ title, children }) {
  return (
    <div className="space-y-3 border-b border-border/80 pb-5 last:border-b-0 last:pb-0">
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground/80">
        {title}
      </h3>
      {children}
    </div>
  );
}

function CheckboxOption({ name, option, activeValues }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm text-foreground">
      <span className="flex items-center gap-3">
        <input
          type="checkbox"
          name={name}
          value={option.value}
          defaultChecked={activeValues.includes(option.value)}
          className="size-4 rounded border-border text-brand-red focus:ring-brand-red/20"
        />
        <span>{option.label}</span>
      </span>
      <span className="text-muted-foreground">({option.count})</span>
    </label>
  );
}

function FilterSidebar({ basePath, filters, filterData, mode }) {
  const { t } = useLanguage();
  const clearHref =
    mode === "search"
      ? createHref(basePath, { ...filters, brand: "", model: "", year: null, conditions: [], availability: [], positions: [], partsBrands: [], minPrice: null, maxPrice: null, page: 1 }, { sort: filters.sort, view: filters.view, q: filters.q })
      : createHref(basePath, { ...filters, q: mode === "shop" ? "" : filters.q, brand: "", model: "", year: null, conditions: [], availability: [], positions: [], partsBrands: [], minPrice: null, maxPrice: null, page: 1 }, { sort: filters.sort, view: filters.view });

  return (
    <Card className="rounded-[2rem] p-5">
      <form action={basePath} className="space-y-5">
        <HiddenFields filters={filters} exclude={["q", "category", "brand", "model", "year", "condition", "availability", "position", "partsBrand", "minPrice", "maxPrice", "page"]} />
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand-navy/5 p-2 text-brand-navy">
            <FilterIcon className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{t("filterResults")}</h2>
            <p className="text-sm text-muted-foreground">{t("refineListingDescription")}</p>
          </div>
        </div>
        <FilterSection title={t("searchWithinResults")}>
          <div className="relative">
            <input
              type="search"
              name="q"
              defaultValue={filters.q}
              placeholder={t("searchParts")}
              className="h-12 w-full rounded-2xl border border-border bg-white px-4 pe-11 text-sm text-foreground shadow-sm outline-none transition focus:border-brand-red focus:ring-4 focus:ring-brand-red/10"
            />
            <SearchIcon className="pointer-events-none absolute inset-block-start-1/2 inset-inline-end-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </FilterSection>
        {mode === "shop" ? (
          <FilterSection title={t("category")}>
            <div className="space-y-3">
              {filterData.categories.map((option) => (
                <CheckboxOption
                  key={option.value}
                  name="category"
                  option={option}
                  activeValues={filters.category ? [filters.category] : []}
                />
              ))}
            </div>
          </FilterSection>
        ) : null}
        <FilterSection title={t("carBrand")}>
          <div className="space-y-3">
            {filterData.brands.map((option) => (
              <CheckboxOption
                key={option.value}
                name="brand"
                option={option}
                activeValues={filters.brand ? [filters.brand] : []}
              />
            ))}
          </div>
        </FilterSection>
        <FilterSection title={t("carModel")}>
          <div className="space-y-3">
            {filterData.models.map((option) => (
              <CheckboxOption
                key={option.value}
                name="model"
                option={option}
                activeValues={filters.model ? [filters.model] : []}
              />
            ))}
          </div>
        </FilterSection>
        <FilterSection title={t("manufacturingYear")}>
          <Select name="year" defaultValue={filters.year ? String(filters.year) : ""}>
            <option value="">{t("anyYear")}</option>
            {[2016, 2015, 2014, 2013, 2012, 2011, 2010, 2008, 2006, 2003].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </FilterSection>
        <FilterSection title={t("condition")}>
          <div className="space-y-3">
            {filterData.conditions.map((option) => (
              <CheckboxOption
                key={option.value}
                name="condition"
                option={option}
                activeValues={filters.conditions}
              />
            ))}
          </div>
        </FilterSection>
        <FilterSection title={t("priceRange")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="number"
              min="0"
              name="minPrice"
              defaultValue={filters.minPrice !== null ? String(filters.minPrice / 100) : ""}
              placeholder={t("minPricePlaceholder")}
              className="h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-brand-red focus:ring-4 focus:ring-brand-red/10"
            />
            <input
              type="number"
              min="0"
              name="maxPrice"
              defaultValue={filters.maxPrice !== null ? String(filters.maxPrice / 100) : ""}
              placeholder={t("maxPricePlaceholder")}
              className="h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-brand-red focus:ring-4 focus:ring-brand-red/10"
            />
          </div>
          <p className="text-xs text-muted-foreground">{t("enterSarAmountsNoDecimals")}</p>
        </FilterSection>
        <FilterSection title={t("availability")}>
          <div className="space-y-3">
            {filterData.availability.map((option) => (
              <CheckboxOption
                key={option.value}
                name="availability"
                option={option}
                activeValues={filters.availability}
              />
            ))}
          </div>
        </FilterSection>
        <FilterSection title={t("partPosition")}>
          <div className="space-y-3">
            {filterData.positions.map((option) => (
              <CheckboxOption
                key={option.value}
                name="position"
                option={option}
                activeValues={filters.positions}
              />
            ))}
          </div>
        </FilterSection>
        <FilterSection title={t("productBrand")}>
          <div className="space-y-3">
            {filterData.partsBrands.map((option) => (
              <CheckboxOption
                key={option.value}
                name="partsBrand"
                option={option}
                activeValues={filters.partsBrands}
              />
            ))}
          </div>
        </FilterSection>
        <div className="grid gap-3">
          <Button type="submit" className="w-full">
            {t("applyFilters")}
          </Button>
          <Link href={clearHref} className="w-full">
            <Button variant="outline" className="w-full">
              {t("clearAll")}
            </Button>
          </Link>
        </div>
      </form>
    </Card>
  );
}

function ProductArt({ tone = "default" }) {
  const accentClassName =
    tone === "lighting"
      ? "from-slate-900 via-slate-700 to-slate-500"
      : tone === "engine"
        ? "from-slate-200 via-white to-slate-300"
        : "from-slate-100 via-white to-slate-200";

  return (
    <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-[1.8rem] bg-[radial-gradient(circle_at_top,#ffffff_0%,#eef4fb_60%,#e2e8f0_100%)]">
      <div className={`h-28 w-44 rounded-[1.75rem] bg-gradient-to-br ${accentClassName} shadow-lg`} />
      <div className="absolute -inset-block-end-4 inset-inline-start-6 h-20 w-20 rounded-full border-[10px] border-white/80 bg-[radial-gradient(circle,#f8fafc_0%,#d1d5db_60%,#64748b_100%)] shadow-lg" />
    </div>
  );
}

function ProductCard({ product, view = "grid" }) {
  const { t, getLocalizedField } = useLanguage();
  const stockVariant =
    product.stockCode === "in_stock"
      ? "success"
      : product.stockCode === "limited_stock"
        ? "warning"
        : "error";
  const tone = product.categorySlug === "lighting-parts" ? "lighting" : product.categorySlug === "engine-parts" ? "engine" : "default";
  const localizedName = getLocalizedField(product, "name") || product.name;
  const detailHref = routes.public.productDetail(product.slug);
  const buyNowHref = `${routes.public.checkout}${buildQueryString({
    productId: product.slug,
    qty: 1,
  })}`;

  if (view === "list") {
    return (
      <article className="grid gap-5 rounded-[2rem] border border-border bg-white p-5 shadow-soft md:grid-cols-[260px_1fr]">
        <ProductArt tone={tone} />
        <div className="flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <Link href={detailHref} className="text-2xl font-semibold text-foreground transition hover:text-brand-red">
                  {localizedName}
                </Link>
                <p className="text-sm text-muted-foreground">{product.vehicleSummary}</p>
                <p className="text-sm text-muted-foreground">{product.identifier}</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-border bg-white/90 p-2 text-muted-foreground transition hover:text-brand-red"
                aria-label={t("wishlist")}
              >
                <HeartIcon className="size-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={stockVariant}>{product.stockLabel}</Badge>
              <Badge variant={product.conditionCode === "reconditioned" ? "warning" : "info"}>
                {product.conditionLabel}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-3">
              <PriceDisplay amountMinor={product.priceMinor} className="text-3xl" />
              {product.compareAtMinor ? (
                <span className="text-sm text-muted-foreground line-through">
                  <PriceDisplay
                    amountMinor={product.compareAtMinor}
                    className="font-normal text-muted-foreground"
                  />
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={detailHref}>
                <Button variant="outline">{t("viewDetails")}</Button>
              </Link>
              <Link href={buyNowHref}>
                <Button>
                  <BagIcon className="size-4" />
                  {t("buyNow")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-[2rem] border border-border bg-white shadow-soft">
      <div className="border-b border-border p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
              <Badge variant={stockVariant}>{product.stockLabel}</Badge>
            <Badge variant={product.conditionCode === "reconditioned" ? "warning" : "info"}>
              {product.conditionLabel}
            </Badge>
          </div>
          <button
            type="button"
            className="rounded-full border border-border bg-white/90 p-2 text-muted-foreground transition hover:text-brand-red"
                aria-label={t("wishlist")}
          >
            <HeartIcon className="size-4" />
          </button>
        </div>
        <ProductArt tone={tone} />
      </div>
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <Link href={detailHref} className="line-clamp-2 text-xl font-semibold text-foreground transition hover:text-brand-red">
            {localizedName}
          </Link>
          <p className="text-sm text-muted-foreground">{product.vehicleSummary}</p>
          <p className="text-sm text-muted-foreground">{product.identifier}</p>
          <p className="text-sm text-muted-foreground">{t("condition")}: {product.conditionLabel}</p>
        </div>
        <div className="flex items-end gap-3">
          <PriceDisplay amountMinor={product.priceMinor} className="text-2xl" />
          {product.compareAtMinor ? (
            <span className="text-sm text-muted-foreground line-through">
              <PriceDisplay
                amountMinor={product.compareAtMinor}
                className="font-normal text-muted-foreground"
              />
            </span>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href={detailHref}>
            <Button variant="outline" className="w-full">
              {t("viewDetails")}
            </Button>
          </Link>
          <Link href={buyNowHref}>
            <Button className="w-full">
              <BagIcon className="size-4" />
              {t("buyNow")}
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}

function ListingToolbar({ basePath, filters, sortOptions, products }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-border bg-white p-4 shadow-soft">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          {products.resultCount > 0
            ? t("showingPageOf", {
                page: products.pagination.page,
                totalPages: Math.max(products.pagination.totalPages, 1),
              })
            : t("showingZeroProducts")}
        </p>
        <p className="text-sm font-semibold text-foreground">
          {t("resultsCount", {
            count: products.resultCount,
            suffix: products.resultCount === 1 ? "" : "s",
          })}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-2xl border border-border bg-muted/40 p-1">
          <Link href={createHref(basePath, filters, { view: "grid", page: 1 })}>
            <span
              className={`flex size-11 items-center justify-center rounded-xl transition ${
                filters.view === "grid"
                  ? "bg-brand-navy text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <GridIcon className="size-4" />
            </span>
          </Link>
          <Link href={createHref(basePath, filters, { view: "list", page: 1 })}>
            <span
              className={`flex size-11 items-center justify-center rounded-xl transition ${
                filters.view === "list"
                  ? "bg-brand-navy text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ListIcon className="size-4" />
            </span>
          </Link>
        </div>
        <form action={basePath} className="flex min-w-64 items-center gap-2">
          <HiddenFields filters={filters} exclude={["sort", "page"]} />
          <div className="flex-1">
            <Select name="sort" defaultValue={filters.sort} className="bg-white">
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t("sortByOption", { label: option.label })}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="outline">
            {t("apply")}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Pagination({ basePath, filters, products, paginationRange }) {
  const { t } = useLanguage();
  if (!products.pagination.totalPages || products.pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Link
        href={createHref(basePath, filters, {
          page: Math.max(1, products.pagination.page - 1),
        })}
        aria-disabled={!products.pagination.hasPreviousPage}
        className={!products.pagination.hasPreviousPage ? "pointer-events-none opacity-40" : ""}
      >
        <Button variant="outline">
          <ArrowLeftIcon className="size-4" />
          {t("previous")}
        </Button>
      </Link>
      {paginationRange.map((page) => (
        <Link key={page} href={createHref(basePath, filters, { page })}>
          <span
            className={`inline-flex size-11 items-center justify-center rounded-2xl border text-sm font-semibold transition ${
              page === products.pagination.page
                ? "border-brand-red bg-brand-red text-white"
                : "border-border bg-white text-foreground hover:border-brand-red hover:text-brand-red"
            }`}
          >
            {page}
          </span>
        </Link>
      ))}
      <Link
        href={createHref(basePath, filters, {
          page: products.pagination.page + 1,
        })}
        aria-disabled={!products.pagination.hasNextPage}
        className={!products.pagination.hasNextPage ? "pointer-events-none opacity-40" : ""}
      >
        <Button variant="outline">
          {t("next")}
          <ArrowRightIcon className="size-4" />
        </Button>
      </Link>
    </div>
  );
}

function NoResultsBlock({ filters, mode }) {
  const { t } = useLanguage();
  const title =
    mode === "search" && filters.q
      ? t("noMatchingPartsFoundFor", { query: filters.q })
      : t("noMatchingPartsFound");

  return (
    <Card className="rounded-[2rem]">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="flex items-center justify-center">
          <div className="flex size-40 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,#ffffff_0%,#eef4fb_60%,#dce5f2_100%)]">
            <SearchIcon className="size-14 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-foreground">{title}</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {t("noMatchingPartsDescription")}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-[1.5rem] p-5 shadow-none">
              <CardContent className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">{t("similarCategories")}</h3>
                {["Lighting Parts", "Electrical Parts", "Body Parts"].map((item) => (
                  <p key={item} className="text-sm text-muted-foreground">
                    {item}
                  </p>
                ))}
              </CardContent>
            </Card>
            <Card className="rounded-[1.5rem] p-5 shadow-none">
              <CardContent className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">{t("relatedParts")}</h3>
                {["Headlight Assembly", "Headlight Bulb", "Tail Light"].map((item) => (
                  <p key={item} className="text-sm text-muted-foreground">
                    {item}
                  </p>
                ))}
              </CardContent>
            </Card>
            <Card className="rounded-[1.5rem] p-5 shadow-none">
              <CardContent className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">{t("stillCannotFindIt")}</h3>
                <a
                  href="https://wa.me/966543216789"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25d366] px-4 py-3 font-semibold text-white transition hover:brightness-95"
                >
                  <WhatsappIcon className="size-4" />
                  {t("chatOnWhatsapp")}
                </a>
                <a
                  href="tel:+966543216789"
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:border-brand-red hover:text-brand-red"
                >
                  {t("callUsLabel", { phone: "+966 54 321 6789" })}
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ListingPage({ data, basePath }) {
  const { t } = useLanguage();
  const {
    mode,
    filters,
    sortOptions,
    products,
    category,
    categoryNotFound,
    filterData,
    suggestedSearches,
    paginationRange,
  } = data;

  if (categoryNotFound) {
    return (
      <Container className="space-y-8 py-10">
        <EmptyState
          title={t("categoryNotFound")}
          description={t("categoryNotFoundDescription")}
          actionLabel={t("backToShop")}
          actionHref={routes.public.products}
        />
      </Container>
    );
  }

  return (
    <div className="bg-[linear-gradient(180deg,#f8f7f4_0%,#ffffff_20%,#f8f7f4_100%)]">
      <Container className="space-y-8 py-8 pb-14 lg:py-10">
        <ListingHero
          mode={mode}
          filters={filters}
          category={category}
          products={products}
          suggestedSearches={suggestedSearches}
        />
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <FilterSidebar
            basePath={basePath}
            filters={filters}
            filterData={filterData}
            mode={mode}
          />
          <div className="space-y-6">
            <ListingToolbar
              basePath={basePath}
              filters={filters}
              sortOptions={sortOptions}
              products={products}
            />
            {products.items.length > 0 ? (
              <div
                className={
                  filters.view === "list"
                    ? "space-y-5"
                    : "grid gap-5 md:grid-cols-2 2xl:grid-cols-3"
                }
              >
                {products.items.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    view={filters.view}
                  />
                ))}
              </div>
            ) : (
              <NoResultsBlock filters={filters} mode={mode} />
            )}
            <Pagination
              basePath={basePath}
              filters={filters}
              products={products}
              paginationRange={paginationRange}
            />
          </div>
        </div>
      </Container>
    </div>
  );
}

export function ListingLoadingPage() {
  return (
    <div className="bg-[linear-gradient(180deg,#f8f7f4_0%,#ffffff_20%,#f8f7f4_100%)]">
      <Container className="space-y-8 py-8 pb-14 lg:py-10">
        <Card className="rounded-[2.75rem] p-8">
          <CardContent className="space-y-6">
            <div className="h-4 w-36 animate-pulse rounded-full bg-muted" />
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div className="space-y-4">
                <div className="h-10 w-3/4 animate-pulse rounded-2xl bg-muted" />
                <div className="h-10 w-1/2 animate-pulse rounded-2xl bg-muted" />
                <div className="h-5 w-full animate-pulse rounded-full bg-muted" />
                <div className="h-5 w-4/5 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="h-64 animate-pulse rounded-[2.5rem] bg-muted" />
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="rounded-[2rem] p-5">
            <CardContent className="space-y-4">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-2xl bg-muted" />
              ))}
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card className="rounded-[2rem] p-4">
              <CardContent className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded-full bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded-full bg-muted" />
                </div>
                <div className="h-12 w-64 animate-pulse rounded-2xl bg-muted" />
              </CardContent>
            </Card>
            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

export { ProductCard };
