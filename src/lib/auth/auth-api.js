import { APP_URL, API_BASE_URL, AUTH_BASE_URL } from "@/config/env";
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

export function getAdminSessionRequest(options) {
  return apiGet(endpoints.adminAuth.session, {
    ...options,
    baseUrl: API_BASE_URL,
    credentials: options?.credentials ?? "include",
  });
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

export function signInWithSocialRequest(provider, options = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Social sign-in can only be started in the browser.");
  }

  const normalizedProvider = String(provider ?? "").trim().toLowerCase();

  if (!normalizedProvider) {
    throw new Error("A social auth provider is required.");
  }

  const callbackURL =
    typeof options.callbackURL === "string" && options.callbackURL.trim()
      ? new URL(options.callbackURL, APP_URL).toString()
      : APP_URL;
  const errorCallbackURL =
    typeof options.errorCallbackURL === "string" && options.errorCallbackURL.trim()
      ? new URL(options.errorCallbackURL, APP_URL).toString()
      : null;

  const form = document.createElement("form");
  form.method = "POST";
  form.action = `${AUTH_BASE_URL}${endpoints.auth.signInSocial}`;
  form.style.display = "none";

  const providerInput = document.createElement("input");
  providerInput.type = "hidden";
  providerInput.name = "provider";
  providerInput.value = normalizedProvider;
  form.append(providerInput);

  const callbackInput = document.createElement("input");
  callbackInput.type = "hidden";
  callbackInput.name = "callbackURL";
  callbackInput.value = callbackURL;
  form.append(callbackInput);

  if (errorCallbackURL) {
    const errorCallbackInput = document.createElement("input");
    errorCallbackInput.type = "hidden";
    errorCallbackInput.name = "errorCallbackURL";
    errorCallbackInput.value = errorCallbackURL;
    form.append(errorCallbackInput);
  }

  document.body.append(form);
  form.submit();
  form.remove();
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
