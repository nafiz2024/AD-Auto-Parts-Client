const DEFAULT_ERROR_MESSAGE =
  "Something went wrong while talking to the server. Please try again.";

function normalizeFieldErrors(fieldErrors) {
  if (!fieldErrors || typeof fieldErrors !== "object") {
    return {};
  }

  return Object.entries(fieldErrors).reduce((accumulator, [key, value]) => {
    accumulator[key] = Array.isArray(value)
      ? value.map(String)
      : [String(value)];
    return accumulator;
  }, {});
}

function inferErrorFlags(status, code) {
  const normalizedCode = String(code ?? "").toUpperCase();

  return {
    isAuthError: status === 401,
    isForbidden: status === 403,
    isTotpRequired:
      status === 428 ||
      normalizedCode.includes("TOTP") ||
      normalizedCode.includes("TWO_FACTOR") ||
      normalizedCode.includes("2FA") ||
      normalizedCode.includes("OTP_REQUIRED"),
    isValidationError: status === 400 || status === 422,
    isConflict: status === 409,
    isRateLimited: status === 429,
    isNetworkError: status === 0,
  };
}

export class ApiError extends Error {
  constructor({
    status = 500,
    code = "UNKNOWN_ERROR",
    message = DEFAULT_ERROR_MESSAGE,
    requestId = null,
    fieldErrors = {},
    details = null,
    cause = null,
  } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.fieldErrors = normalizeFieldErrors(fieldErrors);
    this.details = details;
    this.cause = cause;

    Object.assign(this, inferErrorFlags(status, code));
  }
}

export function isApiError(error) {
  return error instanceof ApiError;
}

export function createNetworkError(cause) {
  return new ApiError({
    status: 0,
    code: "NETWORK_ERROR",
    message:
      "We couldn't reach the backend service. Check your connection and try again.",
    details: null,
    cause,
  });
}

export function createTimeoutError(timeoutMs) {
  return new ApiError({
    status: 408,
    code: "REQUEST_TIMEOUT",
    message: `The request timed out after ${timeoutMs}ms.`,
  });
}

export function createApiError({
  status,
  code,
  message,
  requestId,
  fieldErrors,
  details,
  cause,
}) {
  return new ApiError({
    status,
    code,
    message,
    requestId,
    fieldErrors,
    details,
    cause,
  });
}

export function toApiError(error) {
  if (isApiError(error)) {
    return error;
  }

  return createApiError({
    status: 500,
    code: "UNKNOWN_ERROR",
    message: error?.message || DEFAULT_ERROR_MESSAGE,
    cause: error,
  });
}
