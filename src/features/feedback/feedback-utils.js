export function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    return [value];
  }

  return [];
}

export function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

export function firstNumber(...values) {
  for (const value of values) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

export function firstBoolean(...values) {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value > 0;
    }
  }

  return null;
}

export function normalizeItems(payload) {
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

export function getEnvelopeData(result) {
  return result?.data ?? result?.raw ?? result ?? {};
}

export function sanitizeDisplayUrl(value) {
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

export function normalizePagination(meta, fallbackPage = 1, fallbackPageSize = 10) {
  if (!meta || typeof meta !== "object") {
    return {
      currentPage: fallbackPage,
      totalPages: 1,
      totalItems: 0,
      pageSize: fallbackPageSize,
    };
  }

  return {
    currentPage:
      firstNumber(
        meta.currentPage,
        meta.page,
        meta.pagination?.currentPage,
        meta.pagination?.page,
      ) ?? fallbackPage,
    totalPages:
      firstNumber(
        meta.totalPages,
        meta.pages,
        meta.pagination?.totalPages,
        meta.pagination?.pages,
      ) ?? 1,
    totalItems:
      firstNumber(
        meta.totalItems,
        meta.total,
        meta.count,
        meta.pagination?.totalItems,
        meta.pagination?.total,
        meta.pagination?.count,
      ) ?? 0,
    pageSize:
      firstNumber(
        meta.pageSize,
        meta.limit,
        meta.perPage,
        meta.pagination?.pageSize,
        meta.pagination?.limit,
        meta.pagination?.perPage,
      ) ?? fallbackPageSize,
  };
}

export function uniqueBy(items, getter) {
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

export function buildDetailPath(basePath, id) {
  return `${basePath}/${id}`;
}

export function normalizeDate(value) {
  return firstString(value) ?? "";
}
