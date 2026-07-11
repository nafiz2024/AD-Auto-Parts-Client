"use client";

function sanitizeMessage(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed === "[object Object]") {
    return null;
  }

  return trimmed;
}

export function resolveAdminLoadMessage(error, fallbackMessage) {
  if (error?.isForbidden) {
    return "Access denied.";
  }

  if (error?.status === 404) {
    return process.env.NODE_ENV !== "production"
      ? "Admin API route not found. Check the backend admin endpoint wiring."
      : fallbackMessage;
  }

  const backendMessage =
    sanitizeMessage(error?.message) ??
    sanitizeMessage(error?.details?.message) ??
    sanitizeMessage(error?.details?.error);

  if (process.env.NODE_ENV !== "production" && backendMessage) {
    return backendMessage;
  }

  return fallbackMessage;
}
