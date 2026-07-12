import { getErrorMessage } from "@/lib/api/error-messages";

function sanitizeMessage(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed && trimmed !== "[object Object]" ? trimmed : null;
}

function findReadableMessage(value) {
  const directMessage = sanitizeMessage(value);

  if (directMessage) {
    return directMessage;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const nestedMessage = findReadableMessage(entry);

      if (nestedMessage) {
        return nestedMessage;
      }
    }

    return null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  for (const nestedValue of Object.values(value)) {
    const nestedMessage = findReadableMessage(nestedValue);

    if (nestedMessage) {
      return nestedMessage;
    }
  }

  return null;
}

export function resolveApiUiMessage(error, fallbackMessage, { routeScope = "api" } = {}) {
  if (error?.status === 404) {
    return process.env.NODE_ENV !== "production"
      ? `${routeScope} route mismatch. Check the frontend route map against the backend contract.`
      : fallbackMessage;
  }

  const backendMessage =
    findReadableMessage(error?.message) ??
    findReadableMessage(error?.details?.message) ??
    findReadableMessage(error?.details?.error) ??
    findReadableMessage(error?.details?.errors) ??
    findReadableMessage(error?.fieldErrors);

  if (process.env.NODE_ENV !== "production" && backendMessage) {
    return backendMessage;
  }

  return sanitizeMessage(getErrorMessage(error)) ?? fallbackMessage;
}
