import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
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

  if (filters.q) {
    query.search = filters.q;
  }

  if (filters.status) {
    query.isActive = filters.status === "active";
  }

  if (filters.sort) {
    query.sort = filters.sort;
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

function normalizeCategory(item) {
  const active = firstBoolean(item?.isActive, item?.active, item?.status) ?? true;

  return {
    id: item?.id ?? item?._id ?? item?.slug ?? item?.name ?? "category",
    name: firstString(item?.name, item?.title) || "Category",
    slug: firstString(item?.slug),
    description: firstString(item?.description),
    parentCategoryId:
      item?.parentCategoryId ?? item?.parent?.id ?? item?.parent?._id ?? "",
    parentCategoryName:
      firstString(item?.parentCategoryName, item?.parent?.name, item?.parentName) || "",
    imageUrl:
      firstString(item?.imageUrl, item?.iconUrl, item?.thumbnailUrl, item?.image) || "",
    productCount: firstNumber(item?.productCount, item?.productsCount, item?.count),
    displayOrder: firstNumber(item?.displayOrder, item?.sortOrder, item?.order),
    active,
    statusLabel: active ? "active" : "inactive",
  };
}

function buildCategoryPayload(values) {
  const activeValue = values.active;

  return cleanObject({
    name: firstString(values.name),
    slug: firstString(values.slug),
    parentCategoryId: firstString(values.parentCategoryId),
    description: firstString(values.description),
    displayOrder:
      values.displayOrder === "" || values.displayOrder === null || values.displayOrder === undefined
        ? undefined
        : Number(values.displayOrder),
    isActive: typeof activeValue === "boolean" ? activeValue : undefined,
    active: typeof activeValue === "boolean" ? activeValue : undefined,
    status: typeof activeValue === "boolean" ? (activeValue ? "active" : "inactive") : undefined,
  });
}

function categoryDetailPath(categoryId) {
  return `${endpoints.admin.categories}/${categoryId}`;
}

export async function getAdminCategories(filters) {
  const query = buildQuery(filters);
  const response = await apiGet(endpoints.admin.categories, { query });
  const items = normalizeItems(response.data).map(normalizeCategory);
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

export async function getAdminCategoryOptions() {
  const response = await apiGet(endpoints.admin.categories);

  return normalizeItems(response.data).map((item) => ({
    id: item?.id ?? item?._id ?? item?.slug ?? item?.name ?? "category",
    label: firstString(item?.name, item?.title, item?.slug) || "Category",
  }));
}

export async function createAdminCategory(values) {
  const response = await apiPost(endpoints.admin.categories, buildCategoryPayload(values));
  return normalizeCategory(response.data ?? response.raw ?? values);
}

export async function updateAdminCategory(categoryId, values) {
  const response = await apiPatch(
    categoryDetailPath(categoryId),
    buildCategoryPayload(values),
  );
  return normalizeCategory(response.data ?? response.raw ?? values);
}

export async function toggleAdminCategoryStatus(category, nextActive) {
  const response = await apiPatch(categoryDetailPath(category.id), cleanObject({
    isActive: nextActive,
    active: nextActive,
    status: nextActive ? "active" : "inactive",
  }));

  return normalizeCategory(response.data ?? response.raw ?? { ...category, active: nextActive });
}

export async function deleteAdminCategory(categoryId) {
  return apiDelete(categoryDetailPath(categoryId));
}
