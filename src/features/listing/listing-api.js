import { apiGet } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

const PAGE_SIZE = 12;

const previewCategories = [
  {
    id: "engine-parts",
    slug: "engine-parts",
    name: "Engine Parts",
    description:
      "High quality used and reconditioned engine parts inspected for performance and reliability.",
    highlight: "1,248 Parts Available",
    accent: "from-slate-100 via-white to-slate-50",
  },
  {
    id: "lighting-parts",
    slug: "lighting-parts",
    name: "Lighting Parts",
    description:
      "Headlights, fog lamps, tail lamps, and lighting assemblies with transparent condition notes.",
    highlight: "684 Parts Available",
    accent: "from-blue-100 via-white to-cyan-50",
  },
  {
    id: "brake-parts",
    slug: "brake-parts",
    name: "Brake Parts",
    description:
      "Tested brake components prepared for safe replacement and workshop-ready ordering.",
    highlight: "592 Parts Available",
    accent: "from-rose-100 via-white to-orange-50",
  },
  {
    id: "suspension-parts",
    slug: "suspension-parts",
    name: "Suspension Parts",
    description:
      "Struts, shocks, control arms, and mounts selected for trusted second-hand performance.",
    highlight: "436 Parts Available",
    accent: "from-amber-100 via-white to-yellow-50",
  },
  {
    id: "electrical-parts",
    slug: "electrical-parts",
    name: "Electrical Parts",
    description:
      "Alternators, ECUs, switches, and compatible electrical units for popular vehicle platforms.",
    highlight: "508 Parts Available",
    accent: "from-emerald-100 via-white to-teal-50",
  },
  {
    id: "body-parts",
    slug: "body-parts",
    name: "Body Parts",
    description:
      "Exterior and body trim parts with practical pricing for repairs, replacements, and rebuilds.",
    highlight: "402 Parts Available",
    accent: "from-indigo-100 via-white to-sky-50",
  },
];

const previewVehicleBrands = [
  { id: "preview-brand-toyota", slug: "toyota", name: "Toyota" },
  { id: "preview-brand-honda", slug: "honda", name: "Honda" },
  { id: "preview-brand-nissan", slug: "nissan", name: "Nissan" },
  { id: "preview-brand-mitsubishi", slug: "mitsubishi", name: "Mitsubishi" },
  { id: "preview-brand-mazda", slug: "mazda", name: "Mazda" },
];

const previewVehicleModels = [
  { id: "preview-model-corolla", slug: "corolla", name: "Corolla", brandSlug: "toyota" },
  { id: "preview-model-camry", slug: "camry", name: "Camry", brandSlug: "toyota" },
  { id: "preview-model-civic", slug: "civic", name: "Civic", brandSlug: "honda" },
  { id: "preview-model-x-trail", slug: "x-trail", name: "X-Trail", brandSlug: "nissan" },
  { id: "preview-model-lancer", slug: "lancer", name: "Lancer", brandSlug: "mitsubishi" },
  { id: "preview-model-premio", slug: "premio", name: "Premio", brandSlug: "toyota" },
  { id: "preview-model-mazda-3", slug: "mazda-3", name: "Mazda 3", brandSlug: "mazda" },
];

const previewPartsBrands = [
  { id: "preview-parts-brand-denso", slug: "denso", name: "Denso" },
  { id: "preview-parts-brand-bosch", slug: "bosch", name: "Bosch" },
  { id: "preview-parts-brand-aisin", slug: "aisin", name: "Aisin" },
  { id: "preview-parts-brand-valeo", slug: "valeo", name: "Valeo" },
  { id: "preview-parts-brand-hitachi", slug: "hitachi", name: "Hitachi" },
];

const previewProducts = [
  {
    id: "2az-fe-complete-engine",
    slug: "2az-fe-complete-engine",
    name: "2AZ-FE Complete Engine",
    vehicleSummary: "Toyota Camry 2007-2011",
    identifier: "OEM: 19000-28390",
    conditionCode: "used_excellent",
    conditionLabel: "Used - Excellent",
    stockCode: "in_stock",
    stockLabel: "In Stock",
    priceMinor: 6800000,
    compareAtMinor: 8200000,
    categorySlug: "engine-parts",
    categoryName: "Engine Parts",
    vehicleBrandSlug: "toyota",
    vehicleBrandName: "Toyota",
    vehicleModelSlug: "camry",
    vehicleModelName: "Camry",
    yearFrom: 2007,
    yearTo: 2011,
    position: "front",
    partsBrandSlug: "aisin",
    partsBrandName: "Aisin",
    featured: true,
    newestRank: 12,
    relevanceTerms: ["engine", "complete engine", "camry", "2az-fe"],
  },
  {
    id: "1nz-fe-cylinder-head",
    slug: "1nz-fe-cylinder-head",
    name: "1NZ-FE Cylinder Head",
    vehicleSummary: "Toyota Corolla 2003-2008",
    identifier: "OEM: 11101-21061",
    conditionCode: "used_good",
    conditionLabel: "Used - Good",
    stockCode: "in_stock",
    stockLabel: "In Stock",
    priceMinor: 2200000,
    compareAtMinor: 2800000,
    categorySlug: "engine-parts",
    categoryName: "Engine Parts",
    vehicleBrandSlug: "toyota",
    vehicleBrandName: "Toyota",
    vehicleModelSlug: "corolla",
    vehicleModelName: "Corolla",
    yearFrom: 2003,
    yearTo: 2008,
    position: "front",
    partsBrandSlug: "toyota-genuine",
    partsBrandName: "Toyota Genuine",
    featured: true,
    newestRank: 11,
    relevanceTerms: ["engine", "cylinder head", "corolla", "1nz-fe"],
  },
  {
    id: "engine-mount-front",
    slug: "engine-mount-front",
    name: "Engine Mount (Front)",
    vehicleSummary: "Honda Civic 2006-2011",
    identifier: "OEM: 50810-SNA-A82",
    conditionCode: "used_good",
    conditionLabel: "Used - Good",
    stockCode: "limited_stock",
    stockLabel: "Limited Stock",
    priceMinor: 280000,
    compareAtMinor: 380000,
    categorySlug: "engine-parts",
    categoryName: "Engine Parts",
    vehicleBrandSlug: "honda",
    vehicleBrandName: "Honda",
    vehicleModelSlug: "civic",
    vehicleModelName: "Civic",
    yearFrom: 2006,
    yearTo: 2011,
    position: "front",
    partsBrandSlug: "bosch",
    partsBrandName: "Bosch",
    featured: false,
    newestRank: 10,
    relevanceTerms: ["engine mount", "mount", "civic", "front"],
  },
  {
    id: "piston-set-4pcs",
    slug: "piston-set-4pcs",
    name: "Piston Set (4pcs)",
    vehicleSummary: "Mitsubishi Lancer 2008-2015",
    identifier: "OEM: 1110A169",
    conditionCode: "reconditioned",
    conditionLabel: "Reconditioned",
    stockCode: "in_stock",
    stockLabel: "In Stock",
    priceMinor: 650000,
    compareAtMinor: 800000,
    categorySlug: "engine-parts",
    categoryName: "Engine Parts",
    vehicleBrandSlug: "mitsubishi",
    vehicleBrandName: "Mitsubishi",
    vehicleModelSlug: "lancer",
    vehicleModelName: "Lancer",
    yearFrom: 2008,
    yearTo: 2015,
    position: "front",
    partsBrandSlug: "aisin",
    partsBrandName: "Aisin",
    featured: false,
    newestRank: 9,
    relevanceTerms: ["piston", "engine", "lancer"],
  },
  {
    id: "crankshaft-xtrail",
    slug: "crankshaft-xtrail",
    name: "Crankshaft",
    vehicleSummary: "Nissan X-Trail 2007-2013",
    identifier: "OEM: 12200-EN20A",
    conditionCode: "used_excellent",
    conditionLabel: "Used - Excellent",
    stockCode: "in_stock",
    stockLabel: "In Stock",
    priceMinor: 1850000,
    compareAtMinor: 2400000,
    categorySlug: "engine-parts",
    categoryName: "Engine Parts",
    vehicleBrandSlug: "nissan",
    vehicleBrandName: "Nissan",
    vehicleModelSlug: "x-trail",
    vehicleModelName: "X-Trail",
    yearFrom: 2007,
    yearTo: 2013,
    position: "front",
    partsBrandSlug: "hitachi",
    partsBrandName: "Hitachi",
    featured: true,
    newestRank: 8,
    relevanceTerms: ["crankshaft", "engine", "x-trail"],
  },
  {
    id: "oil-pump-assembly",
    slug: "oil-pump-assembly",
    name: "Oil Pump Assembly",
    vehicleSummary: "Toyota Corolla 2003-2008",
    identifier: "OEM: 15100-21020",
    conditionCode: "used_good",
    conditionLabel: "Used - Good",
    stockCode: "limited_stock",
    stockLabel: "Limited Stock",
    priceMinor: 420000,
    compareAtMinor: 550000,
    categorySlug: "engine-parts",
    categoryName: "Engine Parts",
    vehicleBrandSlug: "toyota",
    vehicleBrandName: "Toyota",
    vehicleModelSlug: "corolla",
    vehicleModelName: "Corolla",
    yearFrom: 2003,
    yearTo: 2008,
    position: "front",
    partsBrandSlug: "denso",
    partsBrandName: "Denso",
    featured: false,
    newestRank: 7,
    relevanceTerms: ["oil pump", "engine", "corolla"],
  },
  {
    id: "timing-chain-kit",
    slug: "timing-chain-kit",
    name: "Timing Chain Kit",
    vehicleSummary: "Honda Accord 2008-2012",
    identifier: "OEM: 14401-R40-A01",
    conditionCode: "used_good",
    conditionLabel: "Used - Good",
    stockCode: "in_stock",
    stockLabel: "In Stock",
    priceMinor: 980000,
    compareAtMinor: 1250000,
    categorySlug: "engine-parts",
    categoryName: "Engine Parts",
    vehicleBrandSlug: "honda",
    vehicleBrandName: "Honda",
    vehicleModelSlug: "accord",
    vehicleModelName: "Accord",
    yearFrom: 2008,
    yearTo: 2012,
    position: "front",
    partsBrandSlug: "bosch",
    partsBrandName: "Bosch",
    featured: false,
    newestRank: 6,
    relevanceTerms: ["timing chain", "engine", "accord"],
  },
  {
    id: "intake-manifold-vitz",
    slug: "intake-manifold-vitz",
    name: "Intake Manifold",
    vehicleSummary: "Toyota Vitz 2005-2010",
    identifier: "OEM: 17100-23070",
    conditionCode: "used_good",
    conditionLabel: "Used - Good",
    stockCode: "in_stock",
    stockLabel: "In Stock",
    priceMinor: 560000,
    compareAtMinor: 720000,
    categorySlug: "engine-parts",
    categoryName: "Engine Parts",
    vehicleBrandSlug: "toyota",
    vehicleBrandName: "Toyota",
    vehicleModelSlug: "vitz",
    vehicleModelName: "Vitz",
    yearFrom: 2005,
    yearTo: 2010,
    position: "front",
    partsBrandSlug: "denso",
    partsBrandName: "Denso",
    featured: false,
    newestRank: 5,
    relevanceTerms: ["intake manifold", "engine", "vitz"],
  },
  {
    id: "ecu-engine-control-unit",
    slug: "ecu-engine-control-unit",
    name: "ECU / Engine Control Unit",
    vehicleSummary: "Nissan Sylphy 2006-2011",
    identifier: "OEM: 23710-EN20A",
    conditionCode: "used_good",
    conditionLabel: "Used - Good",
    stockCode: "limited_stock",
    stockLabel: "Limited Stock",
    priceMinor: 1600000,
    compareAtMinor: 2100000,
    categorySlug: "electrical-parts",
    categoryName: "Electrical Parts",
    vehicleBrandSlug: "nissan",
    vehicleBrandName: "Nissan",
    vehicleModelSlug: "sylphy",
    vehicleModelName: "Sylphy",
    yearFrom: 2006,
    yearTo: 2011,
    position: "front",
    partsBrandSlug: "hitachi",
    partsBrandName: "Hitachi",
    featured: true,
    newestRank: 4,
    relevanceTerms: ["ecu", "engine control unit", "electrical", "nissan"],
  },
  {
    id: "toyota-corolla-headlight-left",
    slug: "toyota-corolla-headlight-left",
    name: "Toyota Corolla 2014 Headlight (Left)",
    vehicleSummary: "Toyota Corolla 2014-2016",
    identifier: "OEM: 81150-02B80",
    conditionCode: "used_excellent",
    conditionLabel: "Used - Excellent",
    stockCode: "in_stock",
    stockLabel: "In Stock",
    priceMinor: 850000,
    compareAtMinor: 1100000,
    categorySlug: "lighting-parts",
    categoryName: "Lighting Parts",
    vehicleBrandSlug: "toyota",
    vehicleBrandName: "Toyota",
    vehicleModelSlug: "corolla",
    vehicleModelName: "Corolla",
    yearFrom: 2014,
    yearTo: 2016,
    position: "left",
    partsBrandSlug: "denso",
    partsBrandName: "Denso",
    featured: true,
    newestRank: 3,
    relevanceTerms: ["headlight", "head lamp", "front light", "corolla", "lighting"],
  },
  {
    id: "toyota-corolla-headlight-right",
    slug: "toyota-corolla-headlight-right",
    name: "Toyota Corolla 2014 Headlight (Right)",
    vehicleSummary: "Toyota Corolla 2014-2016",
    identifier: "OEM: 81110-02B80",
    conditionCode: "used_excellent",
    conditionLabel: "Used - Excellent",
    stockCode: "in_stock",
    stockLabel: "In Stock",
    priceMinor: 850000,
    compareAtMinor: 1100000,
    categorySlug: "lighting-parts",
    categoryName: "Lighting Parts",
    vehicleBrandSlug: "toyota",
    vehicleBrandName: "Toyota",
    vehicleModelSlug: "corolla",
    vehicleModelName: "Corolla",
    yearFrom: 2014,
    yearTo: 2016,
    position: "right",
    partsBrandSlug: "denso",
    partsBrandName: "Denso",
    featured: true,
    newestRank: 2,
    relevanceTerms: ["headlight", "head lamp", "front light", "corolla", "lighting"],
  },
  {
    id: "honda-civic-led-headlight-left",
    slug: "honda-civic-led-headlight-left",
    name: "Honda Civic 2016 LED Headlight (Left)",
    vehicleSummary: "Honda Civic 2016-2018",
    identifier: "OEM: 33150-TBA-A01",
    conditionCode: "used_good",
    conditionLabel: "Used - Good",
    stockCode: "limited_stock",
    stockLabel: "Limited Stock",
    priceMinor: 1280000,
    compareAtMinor: 1600000,
    categorySlug: "lighting-parts",
    categoryName: "Lighting Parts",
    vehicleBrandSlug: "honda",
    vehicleBrandName: "Honda",
    vehicleModelSlug: "civic",
    vehicleModelName: "Civic",
    yearFrom: 2016,
    yearTo: 2018,
    position: "left",
    partsBrandSlug: "bosch",
    partsBrandName: "Bosch",
    featured: true,
    newestRank: 1,
    relevanceTerms: ["headlight", "led headlight", "civic", "lighting"],
  },
  {
    id: "mazda-3-headlight-left",
    slug: "mazda-3-headlight-left",
    name: "Mazda 3 2015 Headlight (Left)",
    vehicleSummary: "Mazda 3 2014-2016",
    identifier: "OEM: BJ5R-51-041H",
    conditionCode: "used_good",
    conditionLabel: "Used - Good",
    stockCode: "limited_stock",
    stockLabel: "Limited Stock",
    priceMinor: 950000,
    compareAtMinor: 1250000,
    categorySlug: "lighting-parts",
    categoryName: "Lighting Parts",
    vehicleBrandSlug: "mazda",
    vehicleBrandName: "Mazda",
    vehicleModelSlug: "mazda-3",
    vehicleModelName: "Mazda 3",
    yearFrom: 2014,
    yearTo: 2016,
    position: "left",
    partsBrandSlug: "valeo",
    partsBrandName: "Valeo",
    featured: false,
    newestRank: 13,
    relevanceTerms: ["headlight", "mazda 3", "lighting"],
  },
  {
    id: "nissan-xtrail-headlight-right",
    slug: "nissan-xtrail-headlight-right",
    name: "Nissan X-Trail 2015 Headlight (Right)",
    vehicleSummary: "Nissan X-Trail 2014-2017",
    identifier: "OEM: 26010-4CE0A",
    conditionCode: "used_good",
    conditionLabel: "Used - Good",
    stockCode: "in_stock",
    stockLabel: "In Stock",
    priceMinor: 780000,
    compareAtMinor: 1050000,
    categorySlug: "lighting-parts",
    categoryName: "Lighting Parts",
    vehicleBrandSlug: "nissan",
    vehicleBrandName: "Nissan",
    vehicleModelSlug: "x-trail",
    vehicleModelName: "X-Trail",
    yearFrom: 2014,
    yearTo: 2017,
    position: "right",
    partsBrandSlug: "hitachi",
    partsBrandName: "Hitachi",
    featured: false,
    newestRank: 14,
    relevanceTerms: ["headlight", "x-trail", "lighting"],
  },
  {
    id: "front-brake-caliper-right",
    slug: "front-brake-caliper-right",
    name: "Front Brake Caliper - Right",
    vehicleSummary: "Toyota Corolla 2014-2018",
    identifier: "OEM: 47730-02130",
    conditionCode: "used_good",
    conditionLabel: "Used - Good",
    stockCode: "in_stock",
    stockLabel: "In Stock",
    priceMinor: 420000,
    compareAtMinor: 650000,
    categorySlug: "brake-parts",
    categoryName: "Brake Parts",
    vehicleBrandSlug: "toyota",
    vehicleBrandName: "Toyota",
    vehicleModelSlug: "corolla",
    vehicleModelName: "Corolla",
    yearFrom: 2014,
    yearTo: 2018,
    position: "right",
    partsBrandSlug: "bosch",
    partsBrandName: "Bosch",
    featured: false,
    newestRank: 15,
    relevanceTerms: ["brake caliper", "brake", "corolla"],
  },
  {
    id: "front-shock-absorber-left",
    slug: "front-shock-absorber-left",
    name: "Front Shock Absorber - Left",
    vehicleSummary: "Toyota Corolla 2014-2018",
    identifier: "OEM: 48520-02P10",
    conditionCode: "used_excellent",
    conditionLabel: "Used - Excellent",
    stockCode: "in_stock",
    stockLabel: "In Stock",
    priceMinor: 380000,
    compareAtMinor: 560000,
    categorySlug: "suspension-parts",
    categoryName: "Suspension Parts",
    vehicleBrandSlug: "toyota",
    vehicleBrandName: "Toyota",
    vehicleModelSlug: "corolla",
    vehicleModelName: "Corolla",
    yearFrom: 2014,
    yearTo: 2018,
    position: "left",
    partsBrandSlug: "aisin",
    partsBrandName: "Aisin",
    featured: false,
    newestRank: 16,
    relevanceTerms: ["shock absorber", "suspension", "corolla"],
  },
];

const sortOptions = {
  newest: { value: "newest", label: "Newest" },
  featured: { value: "featured", label: "Featured" },
  relevance: { value: "relevance", label: "Relevance" },
  price_low_to_high: {
    value: "price_low_to_high",
    label: "Price Low to High",
  },
  price_high_to_low: {
    value: "price_high_to_low",
    label: "Price High to Low",
  },
  most_viewed: { value: "most_viewed", label: "Most Viewed" },
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeItems(data) {
  return asArray(data?.items ?? data?.data ?? data);
}

function normalizeCategory(item) {
  return {
    id: item?.id ?? item?._id ?? item?.slug ?? item?.name ?? "category",
    slug: item?.slug ?? item?.id ?? item?._id ?? item?.name?.toLowerCase?.() ?? "category",
    name: item?.name ?? item?.title ?? "Category",
    description: item?.description ?? "Browse inspected used parts for this category.",
    highlight:
      item?.productCount || item?.itemCount || item?.count
        ? `${item?.productCount ?? item?.itemCount ?? item?.count} Parts Available`
        : "Parts Available",
    accent: "from-slate-100 via-white to-slate-50",
  };
}

function normalizeBrand(item) {
  return {
    id: item?.id ?? item?._id ?? item?.slug ?? item?.name ?? "brand",
    slug: item?.slug ?? item?.id ?? item?._id ?? item?.name?.toLowerCase?.() ?? "brand",
    name: item?.name ?? item?.title ?? "Brand",
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

  const vehicleBrand =
    item?.vehicleBrand ?? item?.vehicle?.brand ?? item?.compatibility?.vehicleBrand;
  const vehicleModel =
    item?.vehicleModel ?? item?.vehicle?.model ?? item?.compatibility?.vehicleModel;
  const partsBrand =
    item?.partsBrand ?? item?.brand ?? item?.manufacturer ?? item?.maker;

  return {
    id,
    slug: item?.slug ?? id,
    name: item?.name ?? item?.title ?? "Used Auto Part",
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
    conditionCode: item?.condition ?? null,
    conditionLabel:
      item?.conditionLabel ??
      item?.conditionDisplay ??
      item?.condition ??
      "Used",
    stockCode: item?.stockStatus ?? item?.availability ?? null,
    stockLabel:
      item?.inStock === true
        ? "In Stock"
        : item?.stockStatusLabel ??
          item?.availabilityLabel ??
          item?.stockStatus ??
          "Out of Stock",
    priceMinor,
    compareAtMinor:
      item?.compareAtPriceMinor ??
      item?.originalPriceMinor ??
      item?.priceBeforeDiscountMinor ??
      null,
    categorySlug: item?.category?.slug ?? item?.categorySlug ?? item?.categoryId ?? null,
    categoryName: item?.category?.name ?? item?.categoryName ?? "Products",
    vehicleBrandSlug:
      vehicleBrand?.slug ?? vehicleBrand?.id ?? item?.vehicleBrandId ?? null,
    vehicleBrandName:
      vehicleBrand?.name ?? item?.vehicleBrandName ?? null,
    vehicleModelSlug:
      vehicleModel?.slug ?? vehicleModel?.id ?? item?.vehicleModelId ?? null,
    vehicleModelName:
      vehicleModel?.name ?? item?.vehicleModelName ?? null,
    yearFrom:
      item?.yearFrom ??
      item?.startYear ??
      item?.fromYear ??
      item?.vehicleYearFrom ??
      null,
    yearTo:
      item?.yearTo ??
      item?.endYear ??
      item?.toYear ??
      item?.vehicleYearTo ??
      null,
    position: item?.position ?? null,
    partsBrandSlug:
      partsBrand?.slug ?? partsBrand?.id ?? item?.partsBrandId ?? null,
    partsBrandName:
      partsBrand?.name ?? item?.partsBrandName ?? null,
    featured: false,
    newestRank: 0,
    relevanceTerms: [],
  };
}

async function fetchCollection(request, fallbackItems, normalizer) {
  try {
    const response = await request();
    const items = normalizeItems(response?.data).map(normalizer);

    if (items.length > 0) {
      return {
        items,
        source: "api",
        error: null,
      };
    }

    return {
      items: fallbackItems,
      source: "preview",
      error: null,
    };
  } catch (error) {
    return {
      items: fallbackItems,
      source: "preview",
      error,
    };
  }
}

function toArray(params, key) {
  const value = params?.[key];

  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item).split(",")).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function toSingle(params, ...keys) {
  for (const key of keys) {
    const value = params?.[key];

    if (Array.isArray(value)) {
      const found = value.find(Boolean);
      if (found) {
        return String(found).trim();
      }
    }

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toMinor(value) {
  if (!value) {
    return null;
  }

  const numericValue = Number.parseFloat(String(value).replace(/[^\d.]/g, ""));

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return null;
  }

  return Math.round(numericValue * 100);
}

function normalizeSort(sort, mode) {
  const fallback = mode === "search" ? "relevance" : "newest";
  return sortOptions[sort] ? sort : fallback;
}

function normalizeView(view) {
  return view === "list" ? "list" : "grid";
}

function matchesBackendId(value) {
  return /^[a-f0-9]{24}$/i.test(value) || /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(value);
}

function normalizeSearchParams(searchParams, mode, categorySlug) {
  const q = toSingle(searchParams, "q");
  const category = categorySlug ?? toSingle(searchParams, "category");
  const brand = toSingle(searchParams, "brand", "vehicleBrandId");
  const model = toSingle(searchParams, "model", "vehicleModelId");
  const sort = normalizeSort(toSingle(searchParams, "sort"), mode);
  const view = normalizeView(toSingle(searchParams, "view"));
  const page = toPositiveInt(toSingle(searchParams, "page"), 1);
  const year = toPositiveInt(toSingle(searchParams, "year"), 0) || null;
  const minPrice = toMinor(toSingle(searchParams, "minPrice"));
  const maxPrice = toMinor(toSingle(searchParams, "maxPrice"));

  return {
    q,
    category,
    brand,
    model,
    year,
    sort,
    view,
    page,
    minPrice,
    maxPrice,
    conditions: toArray(searchParams, "condition"),
    availability: toArray(searchParams, "availability"),
    positions: toArray(searchParams, "position"),
    partsBrands: toArray(searchParams, "partsBrand"),
  };
}

function filterPreviewProducts(products, filters) {
  const query = filters.q.toLowerCase();

  return products.filter((product) => {
    if (filters.category && product.categorySlug !== filters.category) {
      return false;
    }

    if (filters.brand && product.vehicleBrandSlug !== filters.brand) {
      return false;
    }

    if (filters.model && product.vehicleModelSlug !== filters.model) {
      return false;
    }

    if (filters.year) {
      const from = product.yearFrom ?? 0;
      const to = product.yearTo ?? from;

      if (filters.year < from || filters.year > to) {
        return false;
      }
    }

    if (filters.conditions.length > 0 && !filters.conditions.includes(product.conditionCode)) {
      return false;
    }

    if (filters.availability.length > 0 && !filters.availability.includes(product.stockCode)) {
      return false;
    }

    if (filters.positions.length > 0 && !filters.positions.includes(product.position)) {
      return false;
    }

    if (
      filters.partsBrands.length > 0 &&
      !filters.partsBrands.includes(product.partsBrandSlug)
    ) {
      return false;
    }

    if (filters.minPrice !== null && product.priceMinor < filters.minPrice) {
      return false;
    }

    if (filters.maxPrice !== null && product.priceMinor > filters.maxPrice) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      product.name,
      product.vehicleSummary,
      product.identifier,
      product.categoryName,
      product.vehicleBrandName,
      product.vehicleModelName,
      ...(product.relevanceTerms ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

function sortPreviewProducts(products, sort) {
  const items = [...products];

  if (sort === "price_low_to_high") {
    return items.sort((left, right) => left.priceMinor - right.priceMinor);
  }

  if (sort === "price_high_to_low") {
    return items.sort((left, right) => right.priceMinor - left.priceMinor);
  }

  if (sort === "most_viewed") {
    return items.sort((left, right) => (right.featured ? 1 : 0) - (left.featured ? 1 : 0));
  }

  if (sort === "featured") {
    return items.sort((left, right) => Number(right.featured) - Number(left.featured));
  }

  if (sort === "relevance") {
    return items.sort((left, right) => {
      const leftScore = left.relevanceTerms?.length ?? 0;
      const rightScore = right.relevanceTerms?.length ?? 0;
      return rightScore - leftScore;
    });
  }

  return items.sort((left, right) => left.newestRank - right.newestRank);
}

function paginatePreviewProducts(products, page) {
  const total = products.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / PAGE_SIZE);
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  return {
    items: products.slice(startIndex, startIndex + PAGE_SIZE),
    pagination: {
      page: currentPage,
      limit: PAGE_SIZE,
      total,
      totalPages,
      hasNextPage: totalPages > 0 && currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    },
  };
}

function countBy(items, getter) {
  return items.reduce((accumulator, item) => {
    const key = getter(item);

    if (!key) {
      return accumulator;
    }

    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});
}

function deriveFilterData(products, categories, vehicleBrands, partsBrands) {
  const categoryCounts = countBy(products, (product) => product.categorySlug);
  const brandCounts = countBy(products, (product) => product.vehicleBrandSlug);
  const modelCounts = countBy(products, (product) => product.vehicleModelSlug);
  const conditionCounts = countBy(products, (product) => product.conditionCode);
  const availabilityCounts = countBy(products, (product) => product.stockCode);
  const positionCounts = countBy(products, (product) => product.position);
  const partsBrandCounts = countBy(products, (product) => product.partsBrandSlug);

  return {
    categories: categories
      .filter((category) => categoryCounts[category.slug])
      .map((category) => ({
        value: category.slug,
        label: category.name,
        count: categoryCounts[category.slug],
      })),
    brands: vehicleBrands
      .filter((brand) => brandCounts[brand.slug])
      .map((brand) => ({
        value: brand.slug,
        label: brand.name,
        count: brandCounts[brand.slug],
      })),
    models: previewVehicleModels
      .filter((model) => modelCounts[model.slug])
      .map((model) => ({
        value: model.slug,
        label: model.name,
        count: modelCounts[model.slug],
      })),
    conditions: [
      { value: "used_excellent", label: "Used - Excellent", count: conditionCounts.used_excellent ?? 0 },
      { value: "used_good", label: "Used - Good", count: conditionCounts.used_good ?? 0 },
      { value: "used_fair", label: "Used - Fair", count: conditionCounts.used_fair ?? 0 },
      { value: "reconditioned", label: "Reconditioned", count: conditionCounts.reconditioned ?? 0 },
    ].filter((item) => item.count > 0),
    availability: [
      { value: "in_stock", label: "In Stock", count: availabilityCounts.in_stock ?? 0 },
      { value: "limited_stock", label: "Limited Stock", count: availabilityCounts.limited_stock ?? 0 },
      { value: "sold_out", label: "Sold Out", count: availabilityCounts.sold_out ?? 0 },
    ].filter((item) => item.count > 0),
    positions: [
      { value: "front", label: "Front", count: positionCounts.front ?? 0 },
      { value: "rear", label: "Rear", count: positionCounts.rear ?? 0 },
      { value: "left", label: "Left", count: positionCounts.left ?? 0 },
      { value: "right", label: "Right", count: positionCounts.right ?? 0 },
      { value: "upper", label: "Upper", count: positionCounts.upper ?? 0 },
      { value: "lower", label: "Lower", count: positionCounts.lower ?? 0 },
    ].filter((item) => item.count > 0),
    partsBrands: partsBrands
      .filter((brand) => partsBrandCounts[brand.slug])
      .map((brand) => ({
        value: brand.slug,
        label: brand.name,
        count: partsBrandCounts[brand.slug],
      })),
  };
}

function createPaginationRange(pagination) {
  if (!pagination.totalPages) {
    return [];
  }

  const pages = new Set([1, pagination.page - 1, pagination.page, pagination.page + 1, pagination.totalPages]);

  return [...pages]
    .filter((value) => value >= 1 && value <= pagination.totalPages)
    .sort((left, right) => left - right);
}

function createSuggestedSearches(query) {
  if (!query) {
    return ["headlight", "alternator", "engine mount", "brake caliper"];
  }

  const normalized = query.toLowerCase();

  if (normalized.includes("head")) {
    return ["head lamp", "headlight assembly", "front light", "car headlight", "LED headlight"];
  }

  if (normalized.includes("brake")) {
    return ["brake caliper", "brake rotor", "brake pad", "master cylinder"];
  }

  return [`${query} assembly`, `${query} OEM`, `${query} used`, `front ${query}`];
}

function buildBackendQuery(filters, mode, taxonomies) {
  const query = {
    limit: PAGE_SIZE,
    page: filters.page,
    sort: filters.sort,
  };

  if (filters.q) {
    query.q = filters.q;
  }

  if (filters.year) {
    query.year = filters.year;
  }

  if (filters.minPrice !== null) {
    query.minPriceMinor = filters.minPrice;
  }

  if (filters.maxPrice !== null) {
    query.maxPriceMinor = filters.maxPrice;
  }

  if (filters.availability[0]) {
    query.availability = filters.availability[0];
  }

  if (filters.positions[0]) {
    query.position = filters.positions[0];
  }

  if (filters.conditions[0]) {
    query.condition = filters.conditions[0];
  }

  if (filters.category) {
    const categoryFromApi = taxonomies.categories.items.find(
      (category) => category.slug === filters.category || category.id === filters.category,
    );

    if (categoryFromApi?.slug && taxonomies.categories.source === "api") {
      query.categorySlug = categoryFromApi.slug;
    }
  }

  if (filters.brand && matchesBackendId(filters.brand)) {
    query.vehicleBrandId = filters.brand;
  }

  if (filters.model && matchesBackendId(filters.model)) {
    query.vehicleModelId = filters.model;
  }

  if (filters.partsBrands[0] && matchesBackendId(filters.partsBrands[0])) {
    query.partsBrandId = filters.partsBrands[0];
  }

  if (mode !== "search" && query.sort === "relevance") {
    query.sort = "newest";
  }

  return query;
}

export async function getListingPageData({ mode, categorySlug = null, searchParams }) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = normalizeSearchParams(resolvedSearchParams, mode, categorySlug);

  const [categories, vehicleBrands, partsBrands] = await Promise.all([
    fetchCollection(() => apiGet(endpoints.public.categories), previewCategories, normalizeCategory),
    fetchCollection(() => apiGet(endpoints.public.vehicleBrands), previewVehicleBrands, normalizeBrand),
    fetchCollection(() => apiGet(endpoints.public.partsBrands), previewPartsBrands, normalizeBrand),
  ]);

  const backendQuery = buildBackendQuery(filters, mode, { categories, vehicleBrands, partsBrands });

  let apiProducts = null;
  let productsError = null;

  try {
    const response = await apiGet(endpoints.public.products, { query: backendQuery });
    const items = normalizeItems(response?.data).map(normalizeProduct);

    if (items.length > 0) {
      const pagination = response?.data?.pagination ?? {
        page: filters.page,
        limit: PAGE_SIZE,
        total: items.length,
        totalPages: Math.ceil(items.length / PAGE_SIZE),
        hasNextPage: false,
        hasPreviousPage: filters.page > 1,
      };

      apiProducts = {
        items,
        source: "api",
        pagination,
        resultCount: response?.data?.resultCount ?? items.length,
        searchMeta: response?.data?.searchMeta ?? null,
      };
    }
  } catch (error) {
    productsError = error;
  }

  const previewBaseProducts = filterPreviewProducts(previewProducts, {
    ...filters,
    page: 1,
  });
  const sortedPreviewProducts = sortPreviewProducts(previewBaseProducts, filters.sort);
  const previewPagination = paginatePreviewProducts(sortedPreviewProducts, filters.page);

  const sourceProducts = apiProducts ?? {
    items: previewPagination.items,
    source: "preview",
    pagination: previewPagination.pagination,
    resultCount: previewBaseProducts.length,
    searchMeta: null,
  };

  const category =
    (filters.category &&
      [...categories.items, ...previewCategories].find(
        (item) => item.slug === filters.category || item.id === filters.category,
      )) ||
    null;

  const categoryNotFound =
    mode === "category" &&
    !category &&
    (categories.source === "preview" || productsError?.status === 404);

  const filterUniverse = apiProducts ? apiProducts.items : previewBaseProducts;
  const filterData = deriveFilterData(
    filterUniverse,
    categories.items,
    vehicleBrands.items,
    partsBrands.items,
  );

  return {
    mode,
    filters,
    sortOptions: Object.values(sortOptions),
    products: sourceProducts,
    productsError,
    categories,
    vehicleBrands,
    partsBrands,
    filterData,
    category,
    categoryNotFound,
    suggestedSearches: createSuggestedSearches(filters.q),
    paginationRange: createPaginationRange(sourceProducts.pagination),
  };
}

export { PAGE_SIZE, previewCategories, previewProducts };
