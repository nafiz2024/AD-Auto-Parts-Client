import { apiGet } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

const SHOP_GRID_PAGE_SIZE = 12;
const SHOP_LIST_PAGE_SIZE = 6;

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
    nameAr: item?.nameAr ?? item?.titleAr ?? "",
  };
}

function normalizeModel(item) {
  return {
    id: item?.id ?? item?._id ?? item?.slug ?? item?.name ?? "model",
    slug: item?.slug ?? item?.id ?? item?._id ?? item?.name?.toLowerCase?.() ?? "model",
    name: item?.name ?? item?.title ?? "Model",
    nameAr: item?.nameAr ?? item?.titleAr ?? "",
    brandSlug:
      item?.brandSlug ??
      item?.vehicleBrand?.slug ??
      item?.brand?.slug ??
      item?.vehicleBrandId ??
      null,
  };
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function firstNumber(...values) {
  for (const value of values) {
    const numericValue = Number(value);

    if (Number.isFinite(numericValue)) {
      return numericValue;
    }
  }

  return null;
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["true", "yes", "1", "in_stock", "available"].includes(normalized);
  }

  if (typeof value === "number") {
    return value > 0;
  }

  return false;
}

function normalizeSlugValue(...values) {
  const raw = firstString(...values);

  if (!raw) {
    return null;
  }

  return raw
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "-");
}

function getCompatibilityEntries(item) {
  return [
    ...asArray(item?.compatibility),
    ...asArray(item?.compatibilities),
    ...asArray(item?.vehicleCompatibility),
    ...asArray(item?.vehicleCompatibilities),
    ...asArray(item?.fitments),
    ...asArray(item?.vehicles),
  ];
}

function normalizeNamedEntity(rawEntity, fallbacks = {}) {
  const id = firstString(
    rawEntity?.id,
    rawEntity?._id,
    fallbacks.id,
  );
  const slug = normalizeSlugValue(
    rawEntity?.slug,
    id,
    rawEntity?.name,
    fallbacks.slug,
    fallbacks.name,
  );
  const name = firstString(
    rawEntity?.name,
    rawEntity?.title,
    fallbacks.name,
  );
  const nameAr = firstString(
    rawEntity?.nameAr,
    rawEntity?.titleAr,
    fallbacks.nameAr,
  );

  if (!id && !slug && !name && !nameAr) {
    return null;
  }

  return {
    id: id ?? slug ?? name ?? "entity",
    slug: slug ?? id ?? normalizeSlugValue(name) ?? "entity",
    name: name ?? nameAr ?? "Unknown",
    nameAr: nameAr ?? "",
  };
}

function normalizeAvailability(item) {
  const numericStock = firstNumber(
    item?.stock,
    item?.quantity,
    item?.stockQuantity,
    item?.inventory,
    item?.inventoryCount,
    item?.availableQuantity,
    item?.qty,
  );
  const rawStatus = normalizeSlugValue(
    item?.stockStatus,
    item?.availability,
    item?.inventoryStatus,
    item?.status,
  );
  const isAvailable =
    normalizeBoolean(item?.inStock) ||
    normalizeBoolean(item?.isInStock) ||
    normalizeBoolean(item?.available);

  if (
    numericStock !== null ||
    rawStatus === "in-stock" ||
    rawStatus === "available" ||
    rawStatus === "limited-stock" ||
    rawStatus === "low-stock" ||
    isAvailable
  ) {
    if (numericStock !== null) {
      return numericStock > 0
        ? { code: "in_stock", label: "In Stock" }
        : { code: "out_of_stock", label: "Out of Stock" };
    }

    if (rawStatus === "out-of-stock" || rawStatus === "sold-out" || rawStatus === "unavailable") {
      return { code: "out_of_stock", label: "Out of Stock" };
    }

    return { code: "in_stock", label: "In Stock" };
  }

  return { code: "check_availability", label: "Check Availability" };
}

function normalizeProductEntities(item) {
  const compatibilityEntries = getCompatibilityEntries(item);
  const brandEntries = [];
  const modelEntries = [];

  const primaryBrand = normalizeNamedEntity(item?.vehicleBrand, {
    id: item?.vehicleBrandId,
    slug: item?.vehicleBrandSlug,
    name: item?.vehicleBrandName ?? item?.carBrand ?? item?.brandName,
    nameAr: item?.vehicleBrandNameAr ?? item?.carBrandAr,
  });
  const fallbackBrand = normalizeNamedEntity(item?.brand, {
    id: item?.brandId,
    slug: item?.brandSlug,
    name: item?.brandName ?? item?.carBrand,
    nameAr: item?.brandNameAr ?? item?.carBrandAr,
  });
  const primaryModel = normalizeNamedEntity(item?.vehicleModel, {
    id: item?.vehicleModelId,
    slug: item?.vehicleModelSlug,
    name: item?.vehicleModelName ?? item?.carModel ?? item?.modelName,
    nameAr: item?.vehicleModelNameAr ?? item?.carModelAr,
  });
  const fallbackModel = normalizeNamedEntity(item?.model, {
    id: item?.modelId,
    slug: item?.modelSlug,
    name: item?.modelName ?? item?.carModel,
    nameAr: item?.modelNameAr ?? item?.carModelAr,
  });

  if (primaryBrand) {
    brandEntries.push(primaryBrand);
  }

  if (fallbackBrand) {
    brandEntries.push(fallbackBrand);
  }

  if (primaryModel) {
    modelEntries.push(primaryModel);
  }

  if (fallbackModel) {
    modelEntries.push(fallbackModel);
  }

  compatibilityEntries.forEach((entry) => {
    const compatibilityBrand = normalizeNamedEntity(entry?.vehicleBrand ?? entry?.brand, {
      id: entry?.vehicleBrandId ?? entry?.brandId,
      slug: entry?.vehicleBrandSlug ?? entry?.brandSlug,
      name: entry?.vehicleBrandName ?? entry?.brandName ?? entry?.carBrand,
      nameAr: entry?.vehicleBrandNameAr ?? entry?.brandNameAr ?? entry?.carBrandAr,
    });
    const compatibilityModel = normalizeNamedEntity(entry?.vehicleModel, {
      id: entry?.vehicleModelId,
      slug: entry?.vehicleModelSlug,
      name: entry?.vehicleModelName ?? entry?.model ?? entry?.carModel,
      nameAr: entry?.vehicleModelNameAr ?? entry?.modelNameAr ?? entry?.carModelAr,
    });

    if (compatibilityBrand) {
      brandEntries.push(compatibilityBrand);
    }

    if (compatibilityModel) {
      modelEntries.push(compatibilityModel);
    }
  });

  const uniqueByValue = (items) => {
    const seen = new Set();

    return items.filter((entry) => {
      const key = entry.slug ?? entry.id ?? entry.name;

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  };

  return {
    brands: uniqueByValue(brandEntries),
    models: uniqueByValue(modelEntries),
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
  const partsBrand =
    item?.partsBrand ?? item?.brand ?? item?.manufacturer ?? item?.maker;
  const productEntities = normalizeProductEntities(item);
  const primaryBrand = productEntities.brands[0] ?? null;
  const primaryModel = productEntities.models[0] ?? null;
  const availability = normalizeAvailability(item);

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
    stockCode: availability.code,
    stockLabel:
      item?.stockStatusLabel ??
      item?.availabilityLabel ??
      availability.label,
    priceMinor,
    compareAtMinor:
      item?.compareAtPriceMinor ??
      item?.originalPriceMinor ??
      item?.priceBeforeDiscountMinor ??
      null,
    categorySlug: item?.category?.slug ?? item?.categorySlug ?? item?.categoryId ?? null,
    categoryName: item?.category?.name ?? item?.categoryName ?? "Products",
    vehicleBrandSlug: primaryBrand?.slug ?? null,
    vehicleBrandId: primaryBrand?.id ?? item?.vehicleBrandId ?? null,
    vehicleBrandName: primaryBrand?.name ?? null,
    vehicleBrandNameAr: primaryBrand?.nameAr ?? "",
    vehicleBrands: productEntities.brands,
    vehicleModelSlug: primaryModel?.slug ?? null,
    vehicleModelId: primaryModel?.id ?? item?.vehicleModelId ?? null,
    vehicleModelName: primaryModel?.name ?? null,
    vehicleModelNameAr: primaryModel?.nameAr ?? "",
    vehicleModels: productEntities.models,
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

async function fetchCollection(request, normalizer) {
  try {
    const response = await request();
    const items = normalizeItems(response?.data).map(normalizer);

    return {
      items,
      source: "api",
      error: null,
    };
  } catch (error) {
    return {
      items: [],
      source: "unavailable",
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

function getShopPageSize(view) {
  return view === "grid" ? SHOP_GRID_PAGE_SIZE : SHOP_LIST_PAGE_SIZE;
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

function countByMany(items, getter) {
  return items.reduce((accumulator, item) => {
    const values = asArray(getter(item)).filter(Boolean);
    const seen = new Set();

    values.forEach((value) => {
      if (seen.has(value)) {
        return;
      }

      seen.add(value);
      accumulator[value] = (accumulator[value] ?? 0) + 1;
    });

    return accumulator;
  }, {});
}

function createOptionsFromProducts(items, getEntries) {
  const optionsByValue = new Map();

  items.forEach((item) => {
    const seen = new Set();

    asArray(getEntries(item)).forEach((entry) => {
      if (!entry) {
        return;
      }

      const value = entry.slug ?? entry.id ?? null;
      const label = entry.name ?? entry.nameAr ?? null;

      if (!value || !label || seen.has(value)) {
        return;
      }

      seen.add(value);

      const current = optionsByValue.get(value);

      if (current) {
        current.count += 1;
        return;
      }

      optionsByValue.set(value, {
        value,
        label,
        labelAr: entry.nameAr ?? "",
        count: 1,
      });
    });
  });

  return [...optionsByValue.values()].sort((left, right) => left.label.localeCompare(right.label));
}

function deriveFilterData(products, categories, vehicleBrands, vehicleModels, partsBrands) {
  const categoryCounts = countBy(products, (product) => product.categorySlug);
  const brandCounts = countByMany(products, (product) =>
    product.vehicleBrands.map((brand) => brand.slug ?? brand.id),
  );
  const modelCounts = countByMany(products, (product) =>
    product.vehicleModels.map((model) => model.slug ?? model.id),
  );
  const conditionCounts = countBy(products, (product) => product.conditionCode);
  const availabilityCounts = countBy(products, (product) => product.stockCode);
  const positionCounts = countBy(products, (product) => product.position);
  const partsBrandCounts = countBy(products, (product) => product.partsBrandSlug);
  const productBrandOptions = createOptionsFromProducts(products, (product) => product.vehicleBrands);
  const productModelOptions = createOptionsFromProducts(products, (product) => product.vehicleModels);
  const taxonomyBrandOptions = vehicleBrands
    .filter((brand) => brandCounts[brand.slug] || brandCounts[brand.id])
    .map((brand) => ({
      value: brand.slug,
      label: brand.name,
      labelAr: brand.nameAr ?? "",
      count: brandCounts[brand.slug] ?? brandCounts[brand.id] ?? 0,
    }));
  const taxonomyModelOptions = vehicleModels
    .filter((model) => modelCounts[model.slug] || modelCounts[model.id])
    .map((model) => ({
      value: model.slug,
      label: model.name,
      labelAr: model.nameAr ?? "",
      count: modelCounts[model.slug] ?? modelCounts[model.id] ?? 0,
    }));
  const mergeOptions = (primary, secondary) => {
    const merged = new Map();

    [...primary, ...secondary].forEach((option) => {
      const existing = merged.get(option.value);

      if (existing) {
        existing.count = Math.max(existing.count, option.count);
        existing.label = existing.label || option.label;
        existing.labelAr = existing.labelAr || option.labelAr || "";
        return;
      }

      merged.set(option.value, { ...option });
    });

    return [...merged.values()].filter((option) => option.count > 0);
  };

  return {
    categories: categories
      .filter((category) => categoryCounts[category.slug])
      .map((category) => ({
        value: category.slug,
        label: category.name,
        count: categoryCounts[category.slug],
      })),
    brands: mergeOptions(productBrandOptions, taxonomyBrandOptions),
    models: mergeOptions(productModelOptions, taxonomyModelOptions),
    conditions: [
      { value: "used_excellent", label: "Used - Excellent", count: conditionCounts.used_excellent ?? 0 },
      { value: "used_good", label: "Used - Good", count: conditionCounts.used_good ?? 0 },
      { value: "used_fair", label: "Used - Fair", count: conditionCounts.used_fair ?? 0 },
      { value: "reconditioned", label: "Reconditioned", count: conditionCounts.reconditioned ?? 0 },
    ].filter((item) => item.count > 0),
    availability: [
      {
        value: "in_stock",
        label: "In Stock",
        translationKey: "inStock",
        count: availabilityCounts.in_stock ?? 0,
      },
      {
        value: "out_of_stock",
        label: "Out of Stock",
        translationKey: "outOfStock",
        count: availabilityCounts.out_of_stock ?? 0,
      },
      {
        value: "check_availability",
        label: "Check Availability",
        translationKey: "checkAvailability",
        count: availabilityCounts.check_availability ?? 0,
      },
    ],
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
  const pageSize = getShopPageSize(filters.view);
  const query = {
    limit: pageSize,
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

  if (filters.brand) {
    const vehicleBrand = taxonomies.vehicleBrands.items.find(
      (brand) => brand.id === filters.brand || brand.slug === filters.brand,
    );

    if (matchesBackendId(filters.brand)) {
      query.vehicleBrandId = filters.brand;
    } else if (vehicleBrand?.id && matchesBackendId(vehicleBrand.id)) {
      query.vehicleBrandId = vehicleBrand.id;
    } else {
      query.vehicleBrandSlug = vehicleBrand?.slug ?? filters.brand;
    }
  }

  if (filters.model) {
    const vehicleModel = taxonomies.vehicleModels.items.find(
      (model) => model.id === filters.model || model.slug === filters.model,
    );

    if (matchesBackendId(filters.model)) {
      query.vehicleModelId = filters.model;
    } else if (vehicleModel?.id && matchesBackendId(vehicleModel.id)) {
      query.vehicleModelId = vehicleModel.id;
    } else {
      query.vehicleModelSlug = vehicleModel?.slug ?? filters.model;
    }
  }

  if (filters.partsBrands[0]) {
    const partsBrand = taxonomies.partsBrands.items.find(
      (brand) => brand.id === filters.partsBrands[0] || brand.slug === filters.partsBrands[0],
    );

    if (matchesBackendId(filters.partsBrands[0])) {
      query.partsBrandId = filters.partsBrands[0];
    } else if (partsBrand?.id && matchesBackendId(partsBrand.id)) {
      query.partsBrandId = partsBrand.id;
    } else {
      query.partsBrandSlug = partsBrand?.slug ?? filters.partsBrands[0];
    }
  }

  if (mode !== "search" && query.sort === "relevance") {
    query.sort = "newest";
  }

  return query;
}

export async function getListingPageData({ mode, categorySlug = null, searchParams }) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = normalizeSearchParams(resolvedSearchParams, mode, categorySlug);
  const pageSize = getShopPageSize(filters.view);

  const [categories, vehicleBrands, vehicleModels, partsBrands] = await Promise.all([
    fetchCollection(() => apiGet(endpoints.public.categories), normalizeCategory),
    fetchCollection(() => apiGet(endpoints.public.vehicleBrands), normalizeBrand),
    fetchCollection(() => apiGet(endpoints.public.vehicleModels), normalizeModel),
    fetchCollection(() => apiGet(endpoints.public.partsBrands), normalizeBrand),
  ]);

  const backendQuery = buildBackendQuery(filters, mode, {
    categories,
    vehicleBrands,
    vehicleModels,
    partsBrands,
  });

  let apiProducts = null;
  let productsError = null;

  try {
    const response = await apiGet(endpoints.public.products, { query: backendQuery });
    const normalizedItems = normalizeItems(response?.data).map(normalizeProduct);
    const responsePagination = response?.data?.pagination ?? null;
    const totalResults =
      responsePagination?.total ??
      response?.data?.resultCount ??
      response?.data?.total ??
      normalizedItems.length;
    const totalPages = Math.max(
      1,
      responsePagination?.totalPages ??
        Math.ceil(totalResults / pageSize),
    );
    const currentPage = Math.min(
      Math.max(responsePagination?.page ?? filters.page, 1),
      totalPages,
    );
    const usesBackendPagination = Boolean(responsePagination);
    const paginatedItems = usesBackendPagination
      ? normalizedItems
      : normalizedItems.slice(
          (currentPage - 1) * pageSize,
          currentPage * pageSize,
        );

    const pagination = {
      page: currentPage,
      limit: responsePagination?.limit ?? pageSize,
      total: totalResults,
      totalPages,
      hasNextPage:
        responsePagination?.hasNextPage ??
        currentPage < totalPages,
      hasPreviousPage:
        responsePagination?.hasPreviousPage ??
        currentPage > 1,
    };

    apiProducts = {
      items: paginatedItems,
      source: "api",
      pagination,
      resultCount: totalResults,
      searchMeta: response?.data?.searchMeta ?? null,
      canonicalPage: currentPage,
    };
  } catch (error) {
    productsError = error;
  }

  const sourceProducts = apiProducts ?? {
    items: [],
    source: productsError ? "unavailable" : "api",
    pagination: {
        page: filters.page,
        limit: pageSize,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
      hasPreviousPage: filters.page > 1,
    },
    resultCount: 0,
    searchMeta: null,
    canonicalPage: 1,
  };

  const category =
    (filters.category &&
      categories.items.find(
        (item) => item.slug === filters.category || item.id === filters.category,
      )) ||
    null;

  const categoryNotFound =
    mode === "category" &&
    !category &&
    (categories.source === "api" || productsError?.status === 404);

  const filterUniverse = apiProducts ? apiProducts.items : [];
  const filterData = deriveFilterData(
    filterUniverse,
    categories.items,
    vehicleBrands.items,
    vehicleModels.items,
    partsBrands.items,
  );

  return {
    mode,
    filters,
    sortOptions: Object.values(sortOptions),
    products: sourceProducts,
    canonicalPage: sourceProducts.canonicalPage,
    productsError,
    categories,
    vehicleBrands,
    vehicleModels,
    partsBrands,
    filterData,
    category,
    categoryNotFound,
    suggestedSearches: createSuggestedSearches(filters.q),
    paginationRange: createPaginationRange(sourceProducts.pagination),
  };
}

export {
  SHOP_GRID_PAGE_SIZE,
  SHOP_LIST_PAGE_SIZE,
  normalizeProduct,
  previewCategories,
  previewProducts,
  previewVehicleBrands,
  previewVehicleModels,
  previewPartsBrands,
};
