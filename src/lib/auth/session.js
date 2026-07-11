import {
  getAdminSessionRequest,
  getTotpStatusRequest,
  getSessionRequest,
  signInWithEmailRequest,
  signInWithSocialRequest,
  signOutRequest,
  signUpWithEmailRequest,
  verifyTotpRequest,
} from "@/lib/auth/auth-api";
import {
  getPrimaryRole,
  isAdminRole,
  isCustomerRole,
} from "@/lib/auth/roles";

export async function getCurrentSession(options) {
  const result = await getSessionRequest(options);
  return result.data ?? result.raw ?? null;
}

export async function getCurrentAdminSession(options) {
  try {
    const result = await getAdminSessionRequest(options);
    return result.data ?? result.raw ?? null;
  } catch (error) {
    if (error?.status === 401) {
      return null;
    }

    if (error?.isTotpRequired || error?.status === 428) {
      return getCurrentSession(options).catch(() => null);
    }

    throw error;
  }
}

export async function refreshSession(options) {
  return getCurrentSession(options);
}

export async function signInWithEmail(email, password, options) {
  const result = await signInWithEmailRequest(email, password, options);
  return result.data ?? result.raw ?? null;
}

export function signInWithSocial(provider, options) {
  return signInWithSocialRequest(provider, options);
}

export async function signUpWithEmail(payload, options) {
  const result = await signUpWithEmailRequest(payload, options);
  return result.data ?? result.raw ?? null;
}

export async function signOut(options) {
  const result = await signOutRequest(options);
  return result.data ?? result.raw ?? null;
}

export async function getTotpStatus(options) {
  const result = await getTotpStatusRequest(options);
  return result.data ?? result.raw ?? null;
}

export async function verifyTotp(payload, options) {
  const result = await verifyTotpRequest(payload, options);
  return result.data ?? result.raw ?? null;
}

export function getCurrentUser(session) {
  return session?.user ?? session?.data?.user ?? null;
}

export function isAuthenticated(session) {
  return Boolean(getCurrentUser(session));
}

export function isAdmin(session) {
  return isAdminRole(session);
}

export function isCustomer(session) {
  return isCustomerRole(session);
}

export function requiresTotp(session) {
  const user = getCurrentUser(session);
  return Boolean(session?.totpRequired ?? user?.requiresTotp);
}

export function hasVerifiedTotp(session) {
  const user = getCurrentUser(session);
  return Boolean(session?.totpVerified ?? user?.totpVerified);
}

export function getSessionRole(session) {
  return getPrimaryRole(session);
}
