"use client";

import { resolveApiUiMessage } from "@/lib/api/ui-errors";

export function resolveAdminLoadMessage(error, fallbackMessage) {
  if (error?.isForbidden) {
    return "Access denied.";
  }

  return resolveApiUiMessage(error, fallbackMessage, { routeScope: "Admin API" });
}
