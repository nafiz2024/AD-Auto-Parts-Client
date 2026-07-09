import { AUTH_BASE_URL } from "@/config/env";
import { apiGet, apiPost } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { endpoints } from "@/lib/api/endpoints";

function buildCustomerSignUpPayload(payload) {
  return {
    name: typeof payload?.name === "string" ? payload.name.trim() : "",
    email: typeof payload?.email === "string" ? payload.email.trim() : "",
    password: typeof payload?.password === "string" ? payload.password : "",
  };
}

async function requestAuthGetWithFallback(paths, options) {
  let lastError = null;

  for (const path of paths) {
    try {
      return await apiGet(path, {
        ...options,
        baseUrl: AUTH_BASE_URL,
      });
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

export function getSessionRequest(options) {
  return requestAuthGetWithFallback(
    [endpoints.auth.getSession, "/get-session"],
    options,
  );
}

export function signInWithEmailRequest(email, password, options) {
  return apiPost(
    endpoints.auth.signInEmail,
    { email, password },
    {
      ...options,
      baseUrl: AUTH_BASE_URL,
      credentials: options?.credentials ?? "include",
    },
  );
}

export function signUpWithEmailRequest(payload, options) {
  return apiPost(endpoints.auth.signUpEmail, buildCustomerSignUpPayload(payload), {
    ...options,
    baseUrl: AUTH_BASE_URL,
    credentials: options?.credentials ?? "include",
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

export function getTotpStatusRequest(options) {
  return requestAuthGetWithFallback(
    [endpoints.auth.totpStatus, "/totp/status"],
    options,
  );
}

export function verifyTotpRequest(payload, options) {
  return apiPost(endpoints.auth.totpVerify, payload, {
    ...options,
    baseUrl: AUTH_BASE_URL,
  });
}
