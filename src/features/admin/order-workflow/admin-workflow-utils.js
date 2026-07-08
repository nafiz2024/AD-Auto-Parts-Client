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
    const numericValue = Number(value);

    if (Number.isFinite(numericValue)) {
      return numericValue;
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

export function normalizeMinorAmount(...values) {
  const amount = firstNumber(...values);
  return amount === null ? null : Math.round(amount);
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

  const currentPage = firstNumber(
    meta.currentPage,
    meta.page,
    meta.pagination?.currentPage,
    meta.pagination?.page,
  ) ?? fallbackPage;
  const totalPages = firstNumber(
    meta.totalPages,
    meta.pages,
    meta.pagination?.totalPages,
    meta.pagination?.pages,
  ) ?? 1;
  const totalItems = firstNumber(
    meta.totalItems,
    meta.total,
    meta.count,
    meta.pagination?.totalItems,
    meta.pagination?.total,
    meta.pagination?.count,
  ) ?? 0;
  const pageSize = firstNumber(
    meta.pageSize,
    meta.limit,
    meta.perPage,
    meta.pagination?.pageSize,
    meta.pagination?.limit,
    meta.pagination?.perPage,
  ) ?? fallbackPageSize;

  return {
    currentPage,
    totalPages,
    totalItems,
    pageSize,
  };
}

export function normalizeAddress(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value.trim() || null;
  }

  const lines = [
    firstString(
      value.fullAddress,
      value.address,
      value.addressLine1,
      value.line1,
      value.street,
    ),
    firstString(value.addressLine2, value.line2, value.neighborhood, value.area),
    firstString(value.city),
    firstString(value.region, value.state, value.province),
    firstString(value.postalCode, value.zipCode),
    firstString(value.country),
  ].filter(Boolean);

  return lines.length > 0 ? lines.join(", ") : null;
}

export function normalizeTimelineEntry(item, index = 0) {
  return {
    id: firstString(item?.id, item?._id, `${index}`) ?? `${index}`,
    status: firstString(item?.status, item?.label, item?.title, item?.type) ?? "Pending",
    description:
      firstString(item?.description, item?.message, item?.details, item?.note) ?? "",
    createdAt: firstString(item?.createdAt, item?.date, item?.timestamp, item?.updatedAt),
    trackingNumber: firstString(item?.trackingNumber),
  };
}

export function normalizeStatusOptions(values, fallback = []) {
  const options = asArray(values)
    .map((value) => {
      if (typeof value === "string") {
        return {
          value,
          label: value,
        };
      }

      return {
        value: firstString(value?.value, value?.key, value?.status),
        label: firstString(value?.label, value?.name, value?.title, value?.status),
      };
    })
    .filter((option) => option.value);

  if (options.length > 0) {
    return options;
  }

  return fallback.map((value) => ({
    value,
    label: value,
  }));
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
