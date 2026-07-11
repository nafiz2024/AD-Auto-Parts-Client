import {
  getCurrentUser,
  getSessionRole,
  isAdmin,
  isAuthenticated,
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
  const authenticated = session?.data?.authenticated === true;
  const user = session?.data?.admin ?? getCurrentUser(session);
  const redirectTo = session?.data?.redirectTo ?? null;
  const role = getSessionRole(session);
  const admin = authenticated && isAdmin(session);
  const active = authenticated && isActiveAdminAccount(session);
  const forbidden = authenticated && (!admin || !active);
  const authStatus = authenticated && !forbidden ? "authenticated" : "unauthenticated";

  return {
    session,
    user,
    role,
    isAuthenticated: authenticated && isAuthenticated(session),
    isAdmin: admin,
    isActive: active,
    forbidden,
    redirectTo,
    authStatus,
    canAccessDashboard: authStatus === "authenticated",
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
