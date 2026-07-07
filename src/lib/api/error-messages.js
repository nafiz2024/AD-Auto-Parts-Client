export function getErrorMessage(error) {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  if (error.isNetworkError) {
    return "We couldn't connect to the service. Please check your connection and try again.";
  }

  if (error.isTotpRequired) {
    return "Admin two-factor verification is required before continuing.";
  }

  if (error.isAuthError) {
    return "You need to sign in to continue.";
  }

  if (error.isForbidden) {
    return "You don't have permission to perform this action.";
  }

  if (error.isValidationError) {
    return error.message || "Please review the highlighted fields and try again.";
  }

  if (error.isConflict) {
    return error.message || "This action conflicts with the current state of the resource.";
  }

  if (error.isRateLimited) {
    return "Too many requests were made in a short time. Please wait a moment and try again.";
  }

  if (error.status === 404) {
    return "The requested resource could not be found.";
  }

  if (error.status >= 500) {
    return "The server ran into a problem. Please try again shortly.";
  }

  return error.message || "Something went wrong. Please try again.";
}

export function getFieldErrors(error) {
  return error?.fieldErrors ?? {};
}

export function getRequestId(error) {
  return error?.requestId ?? null;
}

export function isTotpRequiredError(error) {
  return Boolean(error?.isTotpRequired);
}
