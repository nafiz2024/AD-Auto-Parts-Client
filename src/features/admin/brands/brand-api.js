import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

const DEFAULT_PAGE_SIZE = 10;
const SUPPORTED_SORTS = new Set(["oldest", "name_asc"]);
const SUPPORTED_STATUSES = new Set(["active", "inactive"]);

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

  return "";
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

      if (["active", "true", "1", "enabled", "published"].includes(normalized)) {
        return true;
      }

      if (["inactive", "false", "0", "disabled", "archived"].includes(normalized)) {
        return false;
      }
    }
  }

  return null;
}

function normalizeItems(value) {
  return asArray(value?.items ?? value?.data ?? value);
}

function buildQuery(filters = {}) {
  const query = {
    page: filters.page ?? 1,
    limit: filters.limit ?? DEFAULT_PAGE_SIZE,
  };

  const search = typeof filters.q === "string" ? filters.q.trim() : "";
  const status = typeof filters.status === "string" ? filters.status.trim() : "";
  const sort = typeof filters.sort === "string" ? filters.sort.trim() : "";

  if (search) {
    query.search = search;
  }

  if (SUPPORTED_STATUSES.has(status)) {
    query.status = status;
  }

  if (SUPPORTED_SORTS.has(sort)) {
    query.sort = sort;
  }

  return query;
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

function cleanObject(value) {
  if (Array.isArray(value)) {
    return value.map(cleanObject).filter((entry) => entry !== undefined);
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

function normalizeBrand(item, fallbackType) {
  const active = firstBoolean(item?.isActive, item?.active, item?.status) ?? true;
  const normalizedType = (
    firstString(item?.type, item?.brandType, item?.category, item?.scope) || fallbackType
  ).toLowerCase();
  const type =
    normalizedType.includes("part") ? "parts" : normalizedType.includes("vehicle") ? "vehicle" : fallbackType;

  return {
    id: item?.id ?? item?._id ?? item?.slug ?? item?.name ?? "brand",
    name: firstString(item?.name, item?.title) || "Brand",
    slug: firstString(item?.slug),
    description: firstString(item?.description),
    logoUrl:
      firstString(item?.logoUrl, item?.imageUrl, item?.iconUrl, item?.logo) || "",
    originCountry:
      firstString(item?.originCountry, item?.country, item?.countryOfOrigin) || "",
    modelCount: firstNumber(item?.modelCount, item?.vehicleModelsCount, item?.count),
    active,
    statusLabel: active ? "active" : "inactive",
    type,
  };
}

function buildBrandPayload(values) {
  const activeValue = values.active;

  return cleanObject({
    name: firstString(values.name),
    slug: firstString(values.slug),
    description: firstString(values.description),
    originCountry: firstString(values.originCountry),
    country: firstString(values.originCountry),
    countryOfOrigin: firstString(values.originCountry),
    isActive: typeof activeValue === "boolean" ? activeValue : undefined,
    active: typeof activeValue === "boolean" ? activeValue : undefined,
    status: typeof activeValue === "boolean" ? (activeValue ? "active" : "inactive") : undefined,
  });
}

function configByType(type) {
  const normalizedType = type === "parts" ? "parts" : "vehicle";
  const endpoint =
    normalizedType === "parts"
      ? endpoints.admin.partsBrands
      : endpoints.admin.vehicleBrands;

  return {
    endpoint,
    detailPath: (id) => `${endpoint}/${id}`,
    normalize: (item) => normalizeBrand(item, normalizedType),
  };
}

export async function getAdminBrands(type, filters) {
  const config = configByType(type);
  const query = buildQuery(filters);
  const response = await apiGet(config.endpoint, { query });
  const items = normalizeItems(response.data).map(config.normalize);
  const pagination = normalizePagination(
    response.meta ?? response.raw?.meta,
    items.length,
    query.page,
    query.limit,
  );

  return {
    items,
    pagination,
  };
}

export async function getAdminVehicleBrandOptions() {
  const response = await apiGet(endpoints.admin.vehicleBrands);

  return normalizeItems(response.data).map((item) => ({
    id: item?.id ?? item?._id ?? item?.slug ?? item?.name ?? "brand",
    label: firstString(item?.name, item?.title, item?.slug) || "Vehicle Brand",
  }));
}

export async function createAdminBrand(type, values) {
  const config = configByType(type);
  const response = await apiPost(config.endpoint, buildBrandPayload(values));
  return config.normalize(response.data ?? response.raw ?? values);
}

export async function updateAdminBrand(type, brandId, values) {
  const config = configByType(type);
  const response = await apiPatch(
    config.detailPath(brandId),
    buildBrandPayload(values),
  );
  return config.normalize(response.data ?? response.raw ?? values);
}

export async function toggleAdminBrandStatus(type, brand, nextActive) {
  const config = configByType(type);
  const response = await apiPatch(config.detailPath(brand.id), cleanObject({
    isActive: nextActive,
    active: nextActive,
    status: nextActive ? "active" : "inactive",
  }));

  return config.normalize(response.data ?? response.raw ?? { ...brand, active: nextActive });
}

export async function deleteAdminBrand(type, brandId) {
  const config = configByType(type);
  return apiDelete(config.detailPath(brandId));
}
