import { routes } from "@/constants/routes";
import { buildQueryString } from "@/lib/api/query";

export function sanitizeCustomerRedirect(value, fallback = routes.customer.account) {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return fallback;
  }

  if (value.startsWith("//") || value.startsWith("/admin")) {
    return fallback;
  }

  return value;
}

export function buildCustomerLoginHref(redirectTo = routes.customer.account) {
  return `${routes.public.login}${buildQueryString({
    redirect: sanitizeCustomerRedirect(redirectTo),
  })}`;
}

export function buildCustomerRegisterHref(redirectTo = routes.customer.account) {
  return `${routes.public.register}${buildQueryString({
    redirect: sanitizeCustomerRedirect(redirectTo),
  })}`;
}
