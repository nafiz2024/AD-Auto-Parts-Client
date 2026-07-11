import {
  API_BASE_URL,
  AUTH_BASE_URL,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
} from "@/config/env";
import {
  createApiError,
  createNetworkError,
  createTimeoutError,
  isApiError,
} from "@/lib/api/errors";
import { routes } from "@/constants/routes";
import { withQuery } from "@/lib/api/query";

const DEFAULT_TIMEOUT_MS = 15000;
const REQUEST_ID_HEADERS = ["x-request-id", "request-id", "x-correlation-id"];
const LANGUAGE_STORAGE_KEY = "ad-auto-parts-language";
const LANGUAGE_COOKIE_KEY = "ad-auto-parts-language";
const IS_DEVELOPMENT = process.env.NODE_ENV !== "production";

function normalizePathForChecks(path) {
  return path.startsWith("/") ? path : `/${path}`;
}

function isAdminRequestPath(path) {
  return normalizePathForChecks(path).startsWith("/admin/");
}

function redirectClientAdminAuth(error) {
  if (typeof window === "undefined") {
    return;
  }

  if (!error?.isAuthError && !error?.isTotpRequired) {
    return;
  }

  const target = error.isTotpRequired ? routes.admin.adminTotp : routes.admin.adminLogin;
  const currentPath = `${window.location.pathname}${window.location.search}`;

  if (currentPath !== target) {
    window.location.assign(target);
  }
}

function debugAdminRequest({ path, method, requestUrl, credentials, status, body }) {
  if (!IS_DEVELOPMENT || !isAdminRequestPath(path) || typeof window === "undefined") {
    return;
  }

  console.info("[admin-api]", {
    method,
    url: requestUrl,
    credentials,
    status,
    body,
  });
}

function joinUrl(baseUrl, path) {
  if (/^https?:\/\//i.test(path)) {
    if (
      path.startsWith(API_BASE_URL) ||
      path.startsWith(AUTH_BASE_URL) ||
      path.startsWith(baseUrl)
    ) {
      return path;
    }

    throw new Error(
      `Absolute URL "${path}" is not allowed for this API client request.`,
    );
  }

  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function resolveApiRequestUrl(path, { baseUrl = API_BASE_URL, query } = {}) {
  return joinUrl(baseUrl, withQuery(path, query));
}

function getRequestId(headers, body) {
  const headerRequestId = REQUEST_ID_HEADERS.find((headerName) =>
    headers.has(headerName),
  );

  if (headerRequestId) {
    return headers.get(headerRequestId);
  }

  return body?.requestId ?? null;
}

function normalizeLanguage(value) {
  return SUPPORTED_LANGUAGES.includes(value) ? value : DEFAULT_LANGUAGE;
}

function parseCookieValue(source, key) {
  if (!source) {
    return null;
  }

  const parts = source.split(";").map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${key}=`));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.slice(key.length + 1));
}

async function getRequestLanguage() {
  if (typeof window !== "undefined") {
    const stored =
      window.localStorage.getItem(LANGUAGE_STORAGE_KEY) ??
      parseCookieValue(window.document.cookie, LANGUAGE_COOKIE_KEY);

    return normalizeLanguage(stored);
  }

  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    return normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE_KEY)?.value);
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function isLocalizedPublicRequest({ baseUrl, method, path }) {
  if (baseUrl !== API_BASE_URL) {
    return false;
  }

  if (method !== "GET") {
    return false;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return (
    !normalizedPath.startsWith("/admin/") &&
    !normalizedPath.startsWith("/customer/") &&
    !normalizedPath.startsWith("/health") &&
    !normalizedPath.startsWith("/ready")
  );
}

async function parseResponseBody(response, responseType) {
  const contentType = response.headers.get("content-type") || "";

  if (responseType === "blob") {
    if (contentType.includes("application/json")) {
      return {
        body: await response.json(),
        contentType,
      };
    }

    return {
      body: await response.blob(),
      contentType,
    };
  }

  if (
    contentType.includes("application/json") ||
    contentType.includes("application/problem+json")
  ) {
    return {
      body: await response.json(),
      contentType,
    };
  }

  if (
    contentType.startsWith("text/") ||
    contentType.includes("application/xml") ||
    contentType.includes("application/xhtml+xml")
  ) {
    return {
      body: await response.text(),
      contentType,
    };
  }

  if (response.status === 204) {
    return {
      body: null,
      contentType,
    };
  }

  return {
    body: await response.text(),
    contentType,
  };
}

function normalizeSuccess(response, parsedBody) {
  const { body } = parsedBody;

  if (body && typeof body === "object" && "success" in body) {
    if (body.success === false) {
      const error = createApiError({
        status: response.status,
        code: body.code || "REQUEST_FAILED",
        message: body.message || "The request could not be completed.",
        requestId: getRequestId(response.headers, body),
        fieldErrors: body.fieldErrors || body.errors,
        details: body,
      });
      throw error;
    }

    return {
      status: response.status,
      message: body.message ?? null,
      data: body.data ?? null,
      meta: body.meta ?? null,
      requestId: getRequestId(response.headers, body),
      headers: response.headers,
      response,
      raw: body,
    };
  }

  return {
    status: response.status,
    message: null,
    data: body,
    meta: null,
    requestId: getRequestId(response.headers, body),
    headers: response.headers,
    response,
    raw: body,
  };
}

function normalizeError(response, parsedBody) {
  const body = parsedBody?.body;
  const fallbackMessage =
    response.status >= 500
      ? "The server returned an unexpected error."
      : "The request could not be completed.";

  throw createApiError({
    status: response.status,
    code:
      (body && typeof body === "object" && body.code) ||
      `HTTP_${response.status}`,
    message:
      (body && typeof body === "object" && body.message) ||
      (typeof body === "string" && body) ||
      fallbackMessage,
    requestId: getRequestId(response.headers, body),
    fieldErrors:
      body && typeof body === "object" ? body.fieldErrors || body.errors : {},
    details: body ?? null,
  });
}

function createAbortSignal(timeoutMs, signal) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort("timeout"), timeoutMs);

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      signal.addEventListener(
        "abort",
        () => controller.abort(signal.reason),
        { once: true },
      );
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
}

function buildHeaders(body, headers, language) {
  const requestHeaders = new Headers(headers ?? {});

  if (!(body instanceof FormData) && body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json, application/pdf");
  }

  if (language && !requestHeaders.has("Accept-Language")) {
    requestHeaders.set("Accept-Language", language);
  }

  return requestHeaders;
}

function parseContentDispositionFileName(headers) {
  const contentDisposition = headers.get("content-disposition");

  if (!contentDisposition) {
    return null;
  }

  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const basicMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  return basicMatch?.[1] ?? null;
}

export async function apiRequest(
  path,
  {
    method = "GET",
    baseUrl = API_BASE_URL,
    cache,
    query,
    body,
    headers,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    responseType = "json",
    credentials = "include",
  } = {},
) {
  const language = isLocalizedPublicRequest({ baseUrl, method, path })
    ? await getRequestLanguage()
    : null;
  const localizedQuery =
    language && (!query || query.lang === undefined)
      ? { ...query, lang: language }
      : query;
  const requestUrl = resolveApiRequestUrl(path, {
    baseUrl,
    query: localizedQuery,
  });
  const { signal: timeoutSignal, cleanup } = createAbortSignal(timeoutMs, signal);

  try {
    const response = await fetch(requestUrl, {
      method,
      cache,
      credentials,
      headers: buildHeaders(body, headers, language),
      body:
        body === undefined || body instanceof FormData ? body : JSON.stringify(body),
      signal: timeoutSignal,
    });

    const parsedBody = await parseResponseBody(response, responseType);
    debugAdminRequest({
      path,
      method,
      requestUrl,
      credentials,
      status: response.status,
      body: parsedBody.body,
    });

    if (!response.ok) {
      normalizeError(response, parsedBody);
    }

    if (responseType === "blob" && parsedBody.body instanceof Blob) {
      return {
        ...normalizeSuccess(response, {
          ...parsedBody,
          body: {
            blob: parsedBody.body,
            fileName: parseContentDispositionFileName(response.headers),
            contentType: parsedBody.contentType,
          },
        }),
        blob: parsedBody.body,
        fileName: parseContentDispositionFileName(response.headers),
      };
    }

    return normalizeSuccess(response, parsedBody);
  } catch (error) {
    if (isApiError(error)) {
      if (isAdminRequestPath(path)) {
        redirectClientAdminAuth(error);
      }

      throw error;
    }

    debugAdminRequest({
      path,
      method,
      requestUrl,
      credentials,
      status: null,
      body: error?.message ?? null,
    });

    if (error?.name === "AbortError" && timeoutSignal.aborted) {
      throw createTimeoutError(timeoutMs);
    }

    throw createNetworkError(error);
  } finally {
    cleanup();
  }
}

export function apiGet(path, options) {
  return apiRequest(path, { ...options, method: "GET" });
}

export function apiPost(path, body, options) {
  return apiRequest(path, { ...options, method: "POST", body });
}

export function apiPatch(path, body, options) {
  return apiRequest(path, { ...options, method: "PATCH", body });
}

export function apiPut(path, body, options) {
  return apiRequest(path, { ...options, method: "PUT", body });
}

export function apiDelete(path, options) {
  return apiRequest(path, { ...options, method: "DELETE" });
}

export function apiUpload(path, formData, options) {
  if (!(formData instanceof FormData)) {
    throw new Error("apiUpload expects a FormData instance.");
  }

  return apiRequest(path, {
    ...options,
    method: "POST",
    body: formData,
  });
}

export function apiDownload(path, options) {
  return apiRequest(path, {
    ...options,
    method: options?.method ?? "GET",
    responseType: "blob",
  });
}

export function createObjectUrl(blob) {
  return URL.createObjectURL(blob);
}

export function revokeObjectUrl(objectUrl) {
  URL.revokeObjectURL(objectUrl);
}
