import { apiGet } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function pickCategoryId(item) {
  return item?.id ?? item?._id ?? item?.slug ?? item?.name ?? "category";
}

function normalizeCategory(item) {
  return {
    id: pickCategoryId(item),
    name: item?.name ?? item?.title ?? item?.label ?? "Category",
    slug: item?.slug ?? item?.id ?? item?._id ?? null,
    count: item?.productCount ?? item?.itemCount ?? item?.count ?? null,
    accent: "from-slate-100 to-white",
  };
}

function normalizeBrand(item) {
  return {
    id: item?.id ?? item?._id ?? item?.slug ?? item?.name ?? "brand",
    name: item?.name ?? item?.label ?? "Brand",
    slug: item?.slug ?? item?.id ?? item?._id ?? null,
  };
}

function normalizeProduct(item) {
  const id = item?.id ?? item?._id ?? item?.slug ?? item?.sku ?? "product";
  const priceMinor =
    item?.priceMinor ??
    item?.sellingPriceMinor ??
    item?.currentPriceMinor ??
    item?.price?.amount ??
    0;

  return {
    id,
    name: item?.name ?? item?.title ?? "Used Auto Part",
    slug: item?.slug ?? id,
    vehicleSummary:
      item?.vehicleSummary ??
      item?.compatibilitySummary ??
      item?.fitmentSummary ??
      item?.subtitle ??
      null,
    identifier:
      item?.oemNumber ??
      item?.partNumber ??
      item?.sku ??
      item?.productCode ??
      null,
    conditionCode: item?.condition ?? item?.conditionCode ?? item?.conditionLabel ?? "unknown",
    conditionLabel: item?.conditionLabel ?? item?.conditionDisplay ?? item?.condition ?? "Unknown",
    stockLabel: item?.inStock
      ? "In Stock"
      : item?.stockStatus ?? item?.availabilityLabel ?? "Out of Stock",
    stockCode: item?.stockStatus ?? item?.availability ?? (item?.inStock ? "in_stock" : "out_of_stock"),
    priceMinor,
    compareAtMinor:
      item?.compareAtPriceMinor ??
      item?.originalPriceMinor ??
      item?.priceBeforeDiscountMinor ??
      null,
  };
}

async function fetchCollection(request, normalizer) {
  try {
    const response = await request();
    const rawData = response?.data ?? null;
    const rawItems = rawData?.items ?? rawData?.data ?? rawData;
    const items = asArray(rawItems).map(normalizer);

    return { items, source: "api", error: null };
  } catch (error) {
    return { items: [], source: "unavailable", error };
  }
}

export async function getHomepageData() {
  const [categories, featuredProducts, latestProducts, vehicleBrands] =
    await Promise.all([
      fetchCollection(
        () => apiGet(endpoints.public.categories),
        normalizeCategory,
      ),
      fetchCollection(
        () => apiGet(endpoints.public.products, { query: { limit: 4, sort: "featured" } }),
        normalizeProduct,
      ),
      fetchCollection(
        () => apiGet(endpoints.public.products, { query: { limit: 4, sort: "newest" } }),
        normalizeProduct,
      ),
      fetchCollection(
        () => apiGet(endpoints.public.vehicleBrands),
        normalizeBrand,
      ),
    ]);

  return {
    categories,
    featuredProducts,
    latestProducts,
    vehicleBrands,
    testimonials: {
      items: [],
      source: "deferred",
      error: null,
    },
  };
}
