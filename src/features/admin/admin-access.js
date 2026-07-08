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

export function getAdminDisplayName(session) {
  const user = getCurrentUser(session);
  return user?.name || user?.email || "Admin";
}

export function getAdminSubtitle(session) {
  const user = getCurrentUser(session);
  return user?.email || "Administrator";
}
