import { getErrorMessage } from "@/lib/api/error-messages";

function sanitizeMessage(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed && trimmed !== "[object Object]" ? trimmed : null;
}

export function resolveApiUiMessage(error, fallbackMessage, { routeScope = "api" } = {}) {
  if (error?.status === 404) {
    return process.env.NODE_ENV !== "production"
      ? `${routeScope} route mismatch. Check the frontend route map against the backend contract.`
      : fallbackMessage;
  }

  const backendMessage =
    sanitizeMessage(error?.message) ??
    sanitizeMessage(error?.details?.message) ??
    sanitizeMessage(error?.details?.error);

  if (process.env.NODE_ENV !== "production" && backendMessage) {
    return backendMessage;
  }

  return sanitizeMessage(getErrorMessage(error)) ?? fallbackMessage;
}
