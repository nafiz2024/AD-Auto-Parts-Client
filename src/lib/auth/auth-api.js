import { AUTH_BASE_URL } from "@/config/env";
import { apiGet, apiPost } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

export function getSessionRequest(options) {
  return apiGet(endpoints.auth.getSession, {
    ...options,
    baseUrl: AUTH_BASE_URL,
  });
}

export function signInWithEmailRequest(email, password, options) {
  return apiPost(
    endpoints.auth.signInEmail,
    { email, password },
    {
      ...options,
      baseUrl: AUTH_BASE_URL,
    },
  );
}

export function signUpWithEmailRequest(payload, options) {
  return apiPost(endpoints.auth.signUpEmail, payload, {
    ...options,
    baseUrl: AUTH_BASE_URL,
  });
}

export function signOutRequest(options) {
  return apiPost(
    endpoints.auth.signOut,
    {},
    {
      ...options,
      baseUrl: AUTH_BASE_URL,
    },
  );
}

export function verifyTotpRequest(payload, options) {
  return apiPost(endpoints.auth.totpVerify, payload, {
    ...options,
    baseUrl: AUTH_BASE_URL,
  });
}
