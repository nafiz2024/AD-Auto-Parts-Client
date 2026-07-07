import { API_BASE_URL, AUTH_BASE_URL } from "@/config/env";
import {
  createApiError,
  createNetworkError,
  createTimeoutError,
  isApiError,
} from "@/lib/api/errors";
import { withQuery } from "@/lib/api/query";

const DEFAULT_TIMEOUT_MS = 15000;
const REQUEST_ID_HEADERS = ["x-request-id", "request-id", "x-correlation-id"];

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

function getRequestId(headers, body) {
  const headerRequestId = REQUEST_ID_HEADERS.find((headerName) =>
    headers.has(headerName),
  );

  if (headerRequestId) {
    return headers.get(headerRequestId);
  }

  return body?.requestId ?? null;
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
      throw createApiError({
        status: response.status,
        code: body.code || "REQUEST_FAILED",
        message: body.message || "The request could not be completed.",
        requestId: getRequestId(response.headers, body),
        fieldErrors: body.fieldErrors || body.errors,
        details: body,
      });
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

function buildHeaders(body, headers) {
  const requestHeaders = new Headers(headers ?? {});

  if (!(body instanceof FormData) && body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json, application/pdf");
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
    query,
    body,
    headers,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    responseType = "json",
    credentials = "include",
  } = {},
) {
  const requestUrl = joinUrl(baseUrl, withQuery(path, query));
  const { signal: timeoutSignal, cleanup } = createAbortSignal(timeoutMs, signal);

  try {
    const response = await fetch(requestUrl, {
      method,
      credentials,
      headers: buildHeaders(body, headers),
      body:
        body === undefined || body instanceof FormData ? body : JSON.stringify(body),
      signal: timeoutSignal,
    });

    const parsedBody = await parseResponseBody(response, responseType);

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
      throw error;
    }

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
