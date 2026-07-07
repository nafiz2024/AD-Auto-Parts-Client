export const USER_ROLES = {
  ADMIN: "admin",
  CUSTOMER: "customer",
};

export function getRoleList(session) {
  const user = session?.user ?? session?.data?.user ?? null;

  if (!user) {
    return [];
  }

  if (Array.isArray(user.roles)) {
    return user.roles.map((role) => String(role).toLowerCase());
  }

  if (user.role) {
    return [String(user.role).toLowerCase()];
  }

  return [];
}

export function getPrimaryRole(session) {
  return getRoleList(session)[0] ?? null;
}

export function hasRole(session, role) {
  return getRoleList(session).includes(String(role).toLowerCase());
}

export function isAdminRole(session) {
  return hasRole(session, USER_ROLES.ADMIN);
}

export function isCustomerRole(session) {
  return hasRole(session, USER_ROLES.CUSTOMER);
}
