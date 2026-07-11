import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiUpload,
} from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

const DEFAULT_PAGE_SIZE = 10;

function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    return [value];
  }

  return [];
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

function firstBoolean(...values) {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value > 0;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();

      if (["true", "1", "yes", "published", "active", "enabled"].includes(normalized)) {
        return true;
      }

      if (["false", "0", "no", "draft", "inactive", "disabled"].includes(normalized)) {
        return false;
      }
    }
  }

  return null;
}

function normalizeItems(value) {
  return asArray(value?.items ?? value?.data ?? value);
}

function sanitizeDisplayUrl(value) {
  const normalized = firstString(value);

  if (!normalized) {
    return null;
  }

  if (
    normalized.startsWith("/") ||
    normalized.startsWith("http://") ||
    normalized.startsWith("https://")
  ) {
    return normalized;
  }

  return null;
}

function normalizeMinorAmount(...values) {
  const amount = firstNumber(...values);
  return amount === null ? null : Math.round(amount);
}

function normalizeProductStatus(item) {
  const normalized = (
    firstString(
      item?.publicationStatus,
      item?.productStatus,
      item?.inventoryStatus,
      item?.status,
      item?.availability,
    ) ?? ""
  ).toLowerCase();

  if (!normalized) {
    return "draft";
  }

  if (normalized.includes("sold")) {
    return "sold";
  }

  if (normalized.includes("archive")) {
    return "archived";
  }

  if (normalized.includes("publish") || normalized.includes("active")) {
    return "published";
  }

  if (normalized.includes("draft")) {
    return "draft";
  }

  return normalized.replace(/\s+/g, "_");
}

function normalizeStockStatus(item, stockQuantity) {
  const normalized = (
    firstString(item?.stockStatus, item?.inventoryStatus, item?.availability) ?? ""
  ).toLowerCase();

  if (normalized.includes("sold")) {
    return "sold";
  }

  if (normalized.includes("out")) {
    return "out_of_stock";
  }

  if (normalized.includes("low")) {
    return "low_stock";
  }

  if (normalized.includes("in")) {
    return "in_stock";
  }

  if (stockQuantity !== null && stockQuantity <= 0) {
    return "out_of_stock";
  }

  if (stockQuantity !== null && stockQuantity <= 5) {
    return "low_stock";
  }

  return "in_stock";
}

function normalizeStockLabel(stockStatus) {
  if (stockStatus === "sold") {
    return "Sold";
  }

  if (stockStatus === "out_of_stock") {
    return "Out of Stock";
  }

  if (stockStatus === "low_stock") {
    return "Low Stock";
  }

  return "In Stock";
}

function normalizeMediaItem(item, index) {
  const url = sanitizeDisplayUrl(
    item?.url ??
      item?.imageUrl ??
      item?.src ??
      item?.path ??
      item?.thumbnailUrl ??
      item?.secureUrl,
  );

  if (!url) {
    return null;
  }

  return {
    id: item?.id ?? item?._id ?? item?.publicId ?? `media-${index}`,
    url,
    alt: firstString(item?.alt, item?.altText, item?.title) ?? "Product image",
    isPrimary:
      item?.isPrimary === true ||
      item?.isFeatured === true ||
      item?.primary === true ||
      index === 0,
    sortOrder: firstNumber(item?.sortOrder, item?.position, item?.order, index) ?? index,
  };
}

function uniqueBy(items, getter) {
  const seen = new Set();

  return items.filter((item) => {
    const key = getter(item);

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function normalizeProductSummary(item) {
  const id = item?.id ?? item?._id ?? item?.slug ?? item?.sku ?? "product";
  const stockQuantity = firstNumber(
    item?.stockQuantity,
    item?.quantity,
    item?.availableQuantity,
    item?.inventoryCount,
  );
  const stockStatus = normalizeStockStatus(item, stockQuantity);
  const category =
    item?.category?.name ??
    item?.categoryName ??
    item?.subcategory?.name ??
    item?.subcategoryName ??
    "Products";
  const priceMinor = normalizeMinorAmount(
    item?.priceMinor,
    item?.sellingPriceMinor,
    item?.price?.amount,
    item?.price,
  );
  const primaryImage = sanitizeDisplayUrl(
    item?.primaryImageUrl ??
      item?.featuredImageUrl ??
      item?.imageUrl ??
      item?.thumbnailUrl ??
      item?.image,
  );

  return {
    id,
    slug: item?.slug ?? String(id),
    name: firstString(item?.name, item?.title) ?? "Used Auto Part",
    sku: firstString(item?.sku, item?.partNumber, item?.productCode) ?? "N/A",
    oemNumber: firstString(item?.oemNumber),
    partNumber: firstString(item?.partNumber),
    categoryId: item?.category?.id ?? item?.categoryId ?? item?.category?._id ?? "",
    categoryName: category,
    partsBrandId: item?.partsBrand?.id ?? item?.partsBrandId ?? item?.brand?.id ?? "",
    partsBrandName:
      item?.partsBrand?.name ?? item?.partsBrandName ?? item?.brand?.name ?? item?.brandName ?? "",
    vehicleSummary:
      firstString(item?.vehicleSummary, item?.compatibilitySummary, item?.fitmentSummary) ?? "",
    condition: firstString(item?.condition) ?? "used",
    conditionLabel:
      firstString(item?.conditionLabel, item?.conditionDisplay, item?.condition) ?? "Used",
    stockQuantity,
    stockStatus,
    stockLabel: normalizeStockLabel(stockStatus),
    priceMinor: priceMinor ?? 0,
    compareAtPriceMinor: normalizeMinorAmount(
      item?.compareAtPriceMinor,
      item?.originalPriceMinor,
      item?.previousPriceMinor,
    ),
    publicationStatus: normalizeProductStatus(item),
    createdAt: firstString(item?.createdAt, item?.created_on, item?.createdDate),
    updatedAt: firstString(item?.updatedAt, item?.updated_on, item?.updatedDate),
    featured: firstBoolean(item?.featured, item?.isFeatured) ?? false,
    primaryImage,
  };
}

function normalizeCompatibilityEntry(item, index) {
  return {
    id: item?.id ?? item?._id ?? `compatibility-${index}`,
    vehicleBrandId:
      item?.vehicleBrandId ?? item?.brandId ?? item?.vehicleBrand?.id ?? item?.brand?.id ?? "",
    vehicleBrandName:
      item?.vehicleBrandName ?? item?.vehicleBrand?.name ?? item?.brand?.name ?? "",
    vehicleModelId:
      item?.vehicleModelId ?? item?.modelId ?? item?.vehicleModel?.id ?? item?.model?.id ?? "",
    vehicleModelName:
      item?.vehicleModelName ?? item?.vehicleModel?.name ?? item?.model?.name ?? "",
    yearFrom:
      firstNumber(item?.yearFrom, item?.startYear, item?.fromYear, item?.vehicleYearFrom) ?? "",
    yearTo:
      firstNumber(item?.yearTo, item?.endYear, item?.toYear, item?.vehicleYearTo) ?? "",
    engine: firstString(item?.engine, item?.engineType) ?? "",
    engineCode: firstString(item?.engineCode) ?? "",
    position: firstString(item?.position) ?? "",
  };
}

function normalizeProductDetail(item) {
  const summary = normalizeProductSummary(item);
  const media = uniqueBy(
    [
      ...asArray(item?.media),
      ...asArray(item?.images),
      ...asArray(item?.gallery),
      ...asArray(item?.productImages),
    ]
      .map(normalizeMediaItem)
      .filter(Boolean),
    (entry) => entry.id,
  ).sort((left, right) => left.sortOrder - right.sortOrder);

  const compatibility = asArray(
    item?.compatibility ??
      item?.compatibilities ??
      item?.vehicleCompatibility ??
      item?.fitments,
  )
    .map(normalizeCompatibilityEntry)
    .filter(Boolean);

  return {
    ...summary,
    description: firstString(item?.description, item?.fullDescription) ?? "",
    shortDescription: firstString(item?.shortDescription, item?.summary) ?? "",
    specifications: firstString(item?.specifications, item?.additionalSpecifications) ?? "",
    slug: firstString(item?.slug) ?? "",
    categoryId:
      item?.category?.id ?? item?.categoryId ?? item?.category?._id ?? summary.categoryId ?? "",
    subcategoryId:
      item?.subcategory?.id ?? item?.subcategoryId ?? item?.subcategory?._id ?? "",
    subcategoryName:
      item?.subcategory?.name ?? item?.subcategoryName ?? "",
    partsBrandId:
      item?.partsBrand?.id ?? item?.partsBrandId ?? item?.brand?.id ?? summary.partsBrandId ?? "",
    partsBrandName:
      item?.partsBrand?.name ?? item?.partsBrandName ?? item?.brand?.name ?? summary.partsBrandName,
    oemNumber: firstString(item?.oemNumber) ?? "",
    partNumber: firstString(item?.partNumber) ?? "",
    conditionScore:
      firstNumber(item?.conditionScore, item?.qualityScore, item?.score) ?? "",
    testedStatus: firstString(item?.testedStatus, item?.testStatus) ?? "",
    knownDefects: firstString(item?.knownDefects) ?? "",
    warrantyDays: firstNumber(item?.warrantyDays, item?.warranty) ?? "",
    returnEligible:
      firstBoolean(item?.returnEligible, item?.isReturnEligible) ?? false,
    inventoryStatus: firstString(item?.inventoryStatus, item?.stockStatus) ?? "in_stock",
    lowStockThreshold:
      firstNumber(item?.lowStockThreshold, item?.reorderPoint, item?.lowStockAlertNumber) ?? "",
    featured: firstBoolean(item?.featured, item?.isFeatured) ?? false,
    visibilityStatus: normalizeProductStatus(item),
    media,
    compatibility,
    productViews: firstNumber(item?.productViews, item?.views, item?.viewCount) ?? null,
    orderCount: firstNumber(item?.orderCount, item?.ordersCount, item?.numberOfOrders) ?? null,
    updatedBy: firstString(item?.updatedBy?.name, item?.updatedByName) ?? "",
    changeHistory: asArray(item?.changeHistory ?? item?.history).map((entry, index) => ({
      id: entry?.id ?? entry?._id ?? `history-${index}`,
      timestamp: firstString(entry?.timestamp, entry?.createdAt, entry?.date) ?? "",
      title: firstString(entry?.title, entry?.action) ?? "Updated",
      description: firstString(entry?.description, entry?.summary) ?? "",
      actor: firstString(entry?.actor?.name, entry?.actorName) ?? "",
    })),
  };
}

function normalizeOption(item, fallbackLabel) {
  return {
    id: item?.id ?? item?._id ?? item?.slug ?? item?.value ?? item?.name ?? fallbackLabel,
    label: firstString(item?.name, item?.title, item?.label, item?.slug) ?? fallbackLabel,
    slug: firstString(item?.slug, item?.name, item?.title) ?? "",
    parentId:
      item?.parentId ?? item?.brandId ?? item?.vehicleBrandId ?? item?.categoryId ?? "",
  };
}

function normalizePagination(meta, itemsLength, page, limit) {
  const total = firstNumber(
    meta?.total,
    meta?.itemCount,
    meta?.totalItems,
    meta?.count,
    itemsLength,
  ) ?? itemsLength;
  const totalPages = firstNumber(
    meta?.totalPages,
    meta?.pageCount,
    total > 0 ? Math.ceil(total / limit) : 1,
  ) ?? 1;
  const currentPage = firstNumber(meta?.page, meta?.currentPage, page) ?? page;

  return {
    page: currentPage,
    limit,
    total,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}

function buildListQuery(filters = {}) {
  const query = {
    page: filters.page ?? 1,
    limit: filters.limit ?? DEFAULT_PAGE_SIZE,
  };

  if (filters.q) {
    query.search = filters.q;
  }

  if (filters.sort) {
    query.sort = filters.sort;
  }

  if (filters.status) {
    query.publicationStatus = filters.status;
  }

  if (filters.condition) {
    query.condition = filters.condition;
  }

  if (filters.categoryId) {
    query.category = filters.categoryId;
  }

  if (filters.stock) {
    query.inventoryStatus = filters.stock;
  }

  if (typeof filters.featured === "boolean") {
    query.featured = filters.featured;
  }

  return query;
}

function toMinorFromInput(value) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const numericValue = Number.parseFloat(String(value).replace(/[^\d.]/g, ""));

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return undefined;
  }

  return Math.round(numericValue * 100);
}

function toNumberOrUndefined(value) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function cleanObject(value) {
  if (Array.isArray(value)) {
    return value
      .map(cleanObject)
      .filter((entry) => entry !== undefined);
  }

  if (!value || typeof value !== "object") {
    if (value === "") {
      return undefined;
    }

    return value;
  }

  const entries = Object.entries(value).reduce((accumulator, [key, innerValue]) => {
    const cleaned = cleanObject(innerValue);

    if (
      cleaned === undefined ||
      cleaned === null ||
      (Array.isArray(cleaned) && cleaned.length === 0)
    ) {
      return accumulator;
    }

    accumulator[key] = cleaned;
    return accumulator;
  }, {});

  return Object.keys(entries).length > 0 ? entries : undefined;
}

function buildProductPayload(values) {
  return cleanObject({
    name: firstString(values.name),
    slug: firstString(values.slug),
    sku: firstString(values.sku),
    oemNumber: firstString(values.oemNumber),
    partNumber: firstString(values.partNumber),
    categoryId: firstString(values.categoryId),
    subcategoryId: firstString(values.subcategoryId),
    partsBrandId: firstString(values.partsBrandId),
    shortDescription: firstString(values.shortDescription),
    description: firstString(values.description),
    specifications: firstString(values.specifications),
    condition: firstString(values.condition),
    conditionScore: toNumberOrUndefined(values.conditionScore),
    testedStatus: firstString(values.testedStatus),
    knownDefects: firstString(values.knownDefects),
    warrantyDays: toNumberOrUndefined(values.warrantyDays),
    returnEligible: Boolean(values.returnEligible),
    priceMinor: toMinorFromInput(values.priceSar),
    compareAtPriceMinor: toMinorFromInput(values.comparePriceSar),
    stockQuantity: toNumberOrUndefined(values.stockQuantity),
    lowStockThreshold: toNumberOrUndefined(values.lowStockThreshold),
    inventoryStatus: firstString(values.inventoryStatus),
    status: firstString(values.visibilityStatus),
    featured: Boolean(values.featured),
    compatibility: asArray(values.compatibility)
      .map((entry) =>
        cleanObject({
          vehicleBrandId: firstString(entry.vehicleBrandId),
          vehicleModelId: firstString(entry.vehicleModelId),
          yearFrom: toNumberOrUndefined(entry.yearFrom),
          yearTo: toNumberOrUndefined(entry.yearTo),
          engine: firstString(entry.engine),
          engineCode: firstString(entry.engineCode),
          position: firstString(entry.position),
        }),
      )
      .filter(Boolean),
  });
}

export async function getAdminProducts(filters) {
  const query = buildListQuery(filters);
  const response = await apiGet(endpoints.admin.products, {
    query,
    credentials: "include",
  });
  const items = normalizeItems(response.data).map(normalizeProductSummary);
  const pagination = normalizePagination(
    response.meta ?? response.raw?.meta,
    items.length,
    query.page,
    query.limit,
  );

  return {
    items,
    pagination,
    raw: response.raw,
  };
}

export async function getAdminProductDetail(productId) {
  const response = await apiGet(endpoints.admin.productDetail(productId));
  const payload = response.data ?? response.raw ?? null;
  return normalizeProductDetail(payload);
}

export async function createAdminProduct(values) {
  const response = await apiPost(endpoints.admin.products, buildProductPayload(values));
  const payload = response.data ?? response.raw ?? null;

  if (payload && typeof payload === "object") {
    return normalizeProductDetail(payload);
  }

  return payload;
}

export async function updateAdminProduct(productId, values) {
  const response = await apiPatch(
    endpoints.admin.productDetail(productId),
    buildProductPayload(values),
  );
  const payload = response.data ?? response.raw ?? null;

  if (payload && typeof payload === "object") {
    return normalizeProductDetail(payload);
  }

  return payload;
}

export async function runAdminProductAction(productId, action, extra = {}) {
  const response = await apiPatch(endpoints.admin.productDetail(productId), {
    action,
    ...extra,
  });
  const payload = response.data ?? response.raw ?? null;

  if (payload && typeof payload === "object") {
    return normalizeProductDetail(payload);
  }

  return payload;
}

export async function getAdminCatalogOptions(vehicleBrandId = "") {
  const vehicleModelQuery = vehicleBrandId
    ? { vehicleBrandId, brandId: vehicleBrandId }
    : undefined;

  const [categories, vehicleBrands, vehicleModels, partsBrands] = await Promise.allSettled([
    apiGet(endpoints.admin.categories),
    apiGet(endpoints.admin.vehicleBrands),
    apiGet(endpoints.admin.vehicleModels, { query: vehicleModelQuery }),
    apiGet(endpoints.admin.partsBrands),
  ]);

  function settledData(result) {
    return result.status === "fulfilled" ? result.value.data : [];
  }

  return {
    categories: normalizeItems(settledData(categories)).map((item) => normalizeOption(item, "Category")),
    vehicleBrands: normalizeItems(settledData(vehicleBrands)).map((item) => normalizeOption(item, "Brand")),
    vehicleModels: normalizeItems(settledData(vehicleModels)).map((item) => normalizeOption(item, "Model")),
    partsBrands: normalizeItems(settledData(partsBrands)).map((item) => normalizeOption(item, "Parts Brand")),
  };
}

export async function uploadAdminProductMedia(productId, files) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await apiUpload(endpoints.admin.productMedia(productId), formData);
  const items = normalizeItems(response.data ?? response.raw)
    .map(normalizeMediaItem)
    .filter(Boolean);

  return items;
}

export async function deleteAdminProductMedia(productId, mediaId) {
  return apiDelete(`${endpoints.admin.productMedia(productId)}/${mediaId}`);
}

export async function setPrimaryAdminProductMedia(productId, mediaId) {
  return apiPatch(`${endpoints.admin.productMedia(productId)}/${mediaId}`, {
    action: "setPrimary",
    isPrimary: true,
  });
}

export async function reorderAdminProductMedia(productId, mediaIds) {
  return apiPatch(endpoints.admin.productMedia(productId), {
    action: "reorder",
    mediaIds,
    orderedMediaIds: mediaIds,
    items: mediaIds.map((id, index) => ({ id, order: index })),
  });
}
