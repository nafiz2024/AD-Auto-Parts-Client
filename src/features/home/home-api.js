import { apiGet } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

const previewCategories = [
  { id: "engine-parts", name: "Engine Parts", count: 120, accent: "from-slate-100 to-slate-50" },
  { id: "transmission-parts", name: "Transmission Parts", count: 84, accent: "from-sky-100 to-white" },
  { id: "brake-parts", name: "Brake Parts", count: 98, accent: "from-rose-100 to-white" },
  { id: "suspension-parts", name: "Suspension Parts", count: 65, accent: "from-amber-100 to-white" },
  { id: "lighting-parts", name: "Lighting Parts", count: 52, accent: "from-cyan-100 to-white" },
  { id: "body-parts", name: "Body Parts", count: 77, accent: "from-indigo-100 to-white" },
];

const previewProducts = [
  {
    id: "toyota-corolla-headlight",
    name: "Toyota Corolla Headlight Assembly",
    vehicleSummary: "Toyota Corolla 2014-2016",
    identifier: "OEM: 81110-02A30",
    condition: "Used",
    stockLabel: "In Stock",
    priceMinor: 650000,
    compareAtMinor: 710000,
  },
  {
    id: "front-brake-caliper-set",
    name: "Front Brake Caliper Set",
    vehicleSummary: "Toyota Corolla 2014-2016",
    identifier: "OEM: 47550-02120",
    condition: "Reconditioned",
    stockLabel: "In Stock",
    priceMinor: 580000,
    compareAtMinor: 660000,
  },
  {
    id: "alternator-12v-110a",
    name: "Alternator 12V 110A",
    vehicleSummary: "Toyota Corolla 2014",
    identifier: "OEM: 27060-0D400",
    condition: "Used",
    stockLabel: "Limited Stock",
    priceMinor: 820000,
    compareAtMinor: 910000,
  },
  {
    id: "front-shock-absorber-right",
    name: "Front Shock Absorber",
    vehicleSummary: "Toyota Corolla 2014-2016",
    identifier: "OEM: 48510-02A90",
    condition: "Used",
    stockLabel: "In Stock",
    priceMinor: 460000,
    compareAtMinor: 520000,
  },
];

const previewBrands = [
  { id: "toyota", name: "Toyota" },
  { id: "honda", name: "Honda" },
  { id: "nissan", name: "Nissan" },
  { id: "mitsubishi", name: "Mitsubishi" },
  { id: "mazda", name: "Mazda" },
  { id: "hyundai", name: "Hyundai" },
  { id: "kia", name: "Kia" },
  { id: "bmw", name: "BMW" },
];

const previewTestimonials = [
  {
    id: "review-1",
    name: "A. Rahman",
    quote:
      "The headlight assembly arrived clean, matched the listing, and fit perfectly after a quick compatibility check.",
    purchase: "Purchased: Toyota Corolla Headlight Assembly",
  },
  {
    id: "review-2",
    name: "M. Faisal",
    quote:
      "Support was responsive and helped confirm the part number before I placed my Buy Now order.",
    purchase: "Purchased: Front Brake Caliper Set",
  },
  {
    id: "review-3",
    name: "S. Noor",
    quote:
      "Condition details were clear and the alternator worked exactly as described for our workshop job.",
    purchase: "Purchased: Alternator 12V 110A",
  },
];

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
    condition: item?.condition ?? item?.conditionLabel ?? "Used",
    stockLabel: item?.inStock
      ? "In Stock"
      : item?.stockStatus ?? item?.availabilityLabel ?? "Out of Stock",
    priceMinor,
    compareAtMinor:
      item?.compareAtPriceMinor ??
      item?.originalPriceMinor ??
      item?.priceBeforeDiscountMinor ??
      null,
  };
}

async function fetchCollection(request, fallbackItems, normalizer) {
  try {
    const response = await request();
    const rawData = response?.data ?? null;
    const rawItems = rawData?.items ?? rawData?.data ?? rawData;
    const items = asArray(rawItems).map(normalizer);

    if (items.length > 0) {
      return { items, source: "api", error: null };
    }

    return { items: fallbackItems, source: "preview", error: null };
  } catch (error) {
    return { items: fallbackItems, source: "preview", error };
  }
}

export async function getHomepageData() {
  const [categories, featuredProducts, latestProducts, vehicleBrands] =
    await Promise.all([
      fetchCollection(
        () => apiGet(endpoints.public.categories),
        previewCategories,
        normalizeCategory,
      ),
      fetchCollection(
        () => apiGet(endpoints.public.products, { query: { limit: 4, sort: "featured" } }),
        previewProducts,
        normalizeProduct,
      ),
      fetchCollection(
        () => apiGet(endpoints.public.products, { query: { limit: 4, sort: "newest" } }),
        previewProducts,
        normalizeProduct,
      ),
      fetchCollection(
        () => apiGet(endpoints.public.vehicleBrands),
        previewBrands,
        normalizeBrand,
      ),
    ]);

  return {
    categories,
    featuredProducts,
    latestProducts,
    vehicleBrands,
    testimonials: {
      items: previewTestimonials,
      source: "preview",
      error: null,
    },
  };
}
