import {
  getCurrentUser,
  getSessionRole,
  hasVerifiedTotp,
  isAdmin,
  isAuthenticated,
  requiresTotp,
} from "@/lib/auth/session";

function normalizeStatus(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function pickBoolean(source, keys) {
  for (const key of keys) {
    if (typeof source?.[key] === "boolean") {
      return source[key];
    }
  }

  return null;
}

export function isActiveAdminAccount(session) {
  const user = getCurrentUser(session);

  if (!user) {
    return false;
  }

  if (typeof user.isActive === "boolean") {
    return user.isActive;
  }

  const normalizedStatus = normalizeStatus(user.status);

  if (!normalizedStatus) {
    return true;
  }

  return !["inactive", "disabled", "suspended", "blocked"].includes(normalizedStatus);
}

export function getAdminAccessState(session) {
  const user = getCurrentUser(session);
  const authenticated = isAuthenticated(session);
  const admin = isAdmin(session);
  const active = isActiveAdminAccount(session);
  const totpRequired = requiresTotp(session);
  const totpVerified = hasVerifiedTotp(session);
  const totpPending = authenticated && admin && active && totpRequired && !totpVerified;
  const forbidden = authenticated && (!admin || !active);

  return {
    session,
    user,
    role: getSessionRole(session),
    isAuthenticated: authenticated,
    isAdmin: admin,
    isActive: active,
    totpRequired,
    totpVerified,
    totpPending,
    forbidden,
    canAccessDashboard: authenticated && admin && active && !totpPending,
  };
}

export function getAdminTotpState(session, totpStatus = null) {
  const access = getAdminAccessState(session);
  const normalizedStatus =
    totpStatus && typeof totpStatus === "object"
      ? totpStatus.data ?? totpStatus
      : null;
  const enrolled =
    pickBoolean(normalizedStatus, [
      "enrolled",
      "isEnrolled",
      "enabled",
      "isEnabled",
      "totpEnabled",
      "twoFactorEnabled",
    ]) ??
    pickBoolean(access.user, ["totpEnabled", "twoFactorEnabled"]) ??
    null;
  const verified =
    pickBoolean(normalizedStatus, [
      "verified",
      "isVerified",
      "totpVerified",
      "twoFactorVerified",
    ]) ?? access.totpVerified;
  const required =
    pickBoolean(normalizedStatus, [
      "required",
      "totpRequired",
      "twoFactorRequired",
      "verificationRequired",
    ]) ?? access.totpRequired;
  const enrollmentRequired =
    access.isAuthenticated &&
    access.isAdmin &&
    access.isActive &&
    enrolled === false;
  const verificationRequired =
    access.isAuthenticated &&
    access.isAdmin &&
    access.isActive &&
    !enrollmentRequired &&
    (access.totpPending || Boolean(required) || enrolled === true) &&
    !verified;

  return {
    enrolled,
    verified,
    required: Boolean(required),
    enrollmentRequired,
    verificationRequired,
  };
}

export function getAdminDisplayName(session) {
  const user = getCurrentUser(session);
  return user?.name || user?.email || "Admin";
}

export function getAdminSubtitle(session) {
  const user = getCurrentUser(session);
  return user?.email || "Administrator";
}
