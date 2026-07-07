import { apiGet } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

export function checkBackendHealth(options) {
  return apiGet(endpoints.health.health, options);
}

export function checkBackendReadiness(options) {
  return apiGet(endpoints.health.ready, options);
}
