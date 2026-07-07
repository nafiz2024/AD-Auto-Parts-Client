function isNil(value) {
  return value === undefined || value === null || value === "";
}

function appendValue(params, key, value) {
  if (Array.isArray(value)) {
    value.forEach((item) => appendValue(params, key, item));
    return;
  }

  if (value instanceof Date) {
    params.append(key, value.toISOString());
    return;
  }

  if (typeof value === "boolean") {
    params.append(key, value ? "true" : "false");
    return;
  }

  params.append(key, String(value));
}

export function buildQueryString(query = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (isNil(value)) {
      return;
    }

    appendValue(params, key, value);
  });

  const serialized = params.toString();

  return serialized ? `?${serialized}` : "";
}

export function withQuery(path, query) {
  return `${path}${buildQueryString(query)}`;
}
