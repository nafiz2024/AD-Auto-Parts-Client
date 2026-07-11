function resource(path) {
  return `/${path}`;
}

function byId(path, id) {
  return `/${path}/${id}`;
}

function child(path, id, nestedPath) {
  return `/${path}/${id}/${nestedPath}`;
}

function byNumber(path, value) {
  return `/${path}/${value}`;
}

// These paths are centralized for easy backend alignment.
// Verify exact resource names against the backend contract if they change.
export const endpoints = {
  health: {
    health: resource("health"),
    ready: resource("ready"),
  },
  auth: {
    signUpEmail: "/sign-up/email",
    signInEmail: "/sign-in/email",
    signInSocial: "/sign-in/social",
    signOut: "/sign-out",
    getSession: "/session",
    refreshSession: "/session",
    // Better Auth TOTP route names can vary by plugin configuration.
    totpStatus: "/two-factor/status",
    totpVerify: "/two-factor/verify",
    totpChallenge: "/two-factor/challenge",
  },
  public: {
    settings: resource("public/settings"),
    policies: resource("public/policies"),
    categories: resource("categories"),
    vehicleBrands: resource("vehicle-brands"),
    vehicleModels: resource("vehicle-models"),
    partsBrands: resource("parts-brands"),
    products: resource("products"),
    productDetail: (productId) => byId("products", productId),
    productSearch: resource("products/search"),
    searchSuggestions: resource("search/suggestions"),
    compatibilitySearch: resource("compatibility/search"),
    relatedProducts: (productId) => child("products", productId, "related"),
    deliveryZones: resource("delivery-zones"),
    deliveryEstimate: resource("delivery-estimate"),
    reviews: resource("reviews"),
    productQuestions: resource("product-questions"),
    enquiries: resource("enquiries"),
  },
  customer: {
    profile: resource("customer/profile"),
    orders: resource("customer/orders"),
    orderDetail: (orderNumber) => byNumber("customer/orders", orderNumber),
    cancelOrder: (orderNumber) =>
      child("customer/orders", orderNumber, "cancel"),
    manualPaymentSubmission: resource("customer/payments/manual"),
    shipments: resource("customer/shipments"),
    reviews: resource("customer/reviews"),
    productQuestions: resource("customer/product-questions"),
    enquiries: resource("customer/enquiries"),
    returns: resource("customer/returns"),
    refunds: resource("customer/refunds"),
    invoices: resource("customer/invoices"),
    invoicePdf: (invoiceNumber) =>
      child("customer/invoices", invoiceNumber, "pdf"),
    notifications: resource("customer/notifications"),
    notificationPreferences: resource("customer/notification-preferences"),
  },
  account: {
    summary: resource("account/summary"),
    orders: resource("account/orders"),
    orderDetail: (orderNumber) => byNumber("account/orders", orderNumber),
    payments: resource("account/payments"),
    invoices: resource("account/invoices"),
    notifications: resource("account/notifications"),
    enquiries: resource("account/enquiries"),
    reviews: resource("account/reviews"),
    questions: resource("account/questions"),
    returns: resource("account/returns"),
    profile: resource("account/profile"),
  },
  orders: {
    checkout: resource("orders/checkout"),
  },
  admin: {
    dashboard: resource("admin/dashboard"),
    categories: resource("admin/categories"),
    vehicleBrands: resource("admin/vehicle-brands"),
    vehicleModels: resource("admin/vehicle-models"),
    partsBrands: resource("admin/parts-brands"),
    products: resource("admin/products"),
    productDetail: (productId) => byId("admin/products", productId),
    productMedia: (productId) => child("admin/products", productId, "media"),
    deliveryZones: resource("admin/delivery-zones"),
    couriers: resource("admin/couriers"),
    orders: resource("admin/orders"),
    orderDetail: (orderNumber) => byNumber("admin/orders", orderNumber),
    payments: resource("admin/payments"),
    shipments: resource("admin/shipments"),
    customers: resource("admin/customers"),
    reviews: resource("admin/reviews"),
    questions: resource("admin/product-questions"),
    enquiries: resource("admin/enquiries"),
    returns: resource("admin/returns"),
    refunds: resource("admin/refunds"),
    invoices: resource("admin/invoices"),
    analytics: resource("admin/analytics"),
    settings: resource("admin/settings"),
    notifications: resource("admin/notifications"),
    auditLogs: resource("admin/audit-logs"),
  },
};
