const ADMIN_ORDERS_REFRESH_EVENT = "admin-orders:refresh";

export function notifyAdminOrdersRefresh(detail = {}) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(ADMIN_ORDERS_REFRESH_EVENT, {
      detail,
    }),
  );
}

export function subscribeAdminOrdersRefresh(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = (event) => {
    callback(event);
  };

  window.addEventListener(ADMIN_ORDERS_REFRESH_EVENT, handler);
  return () => {
    window.removeEventListener(ADMIN_ORDERS_REFRESH_EVENT, handler);
  };
}
