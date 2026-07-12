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

export const adminApi = {
  dashboard: "/admin/dashboard",
  dashboardSummary: "/admin/dashboard/summary",
  products: "/admin/products",
  productDetail: (productId) => `/admin/products/${productId}`,
  orders: "/admin/orders",
  orderDetail: (orderNumber) => `/admin/orders/${orderNumber}`,
  invoices: "/admin/invoices",
  invoiceDetail: (invoiceNumber) => `/admin/invoices/${invoiceNumber}`,
  invoicePdf: (invoiceNumber) => `/admin/invoices/${invoiceNumber}/pdf`,
  shipments: "/admin/shipments",
  categories: "/admin/categories",
  brands: "/admin/brands",
  customers: "/admin/customers",
  reviews: "/admin/reviews",
  productQuestions: "/admin/product-questions",
  enquiries: "/admin/enquiries",
  settings: "/admin/settings",
  notifications: "/admin/notifications",
  notificationsUnreadCount: "/admin/notifications/unread-count",
  notificationMarkRead: (notificationId) => `/admin/notifications/${notificationId}/read`,
  notificationsReadAll: "/admin/notifications/read-all",
};

export const accountApi = {
  summary: "/account/summary",
  orders: "/account/orders",
  orderDetail: (orderNumber) => `/account/orders/${orderNumber}`,
  invoices: "/account/invoices",
  notifications: "/account/notifications",
  enquiries: "/account/enquiries",
  reviews: "/account/reviews",
  questions: "/account/questions",
  returns: "/account/returns",
  profile: "/account/profile",
};

export const adminAuthApi = {
  session: "/admin/auth/session",
};

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
  adminAuth: {
    session: adminAuthApi.session,
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
    summary: accountApi.summary,
    orders: accountApi.orders,
    orderDetail: accountApi.orderDetail,
    payments: resource("account/payments"),
    invoices: accountApi.invoices,
    notifications: accountApi.notifications,
    enquiries: accountApi.enquiries,
    reviews: accountApi.reviews,
    questions: accountApi.questions,
    returns: accountApi.returns,
    profile: accountApi.profile,
  },
  orders: {
    checkout: resource("orders/checkout"),
  },
  admin: {
    dashboard: adminApi.dashboard,
    dashboardSummary: adminApi.dashboardSummary,
    categories: adminApi.categories,
    vehicleBrands: resource("admin/vehicle-brands"),
    vehicleModels: resource("admin/vehicle-models"),
    partsBrands: resource("admin/parts-brands"),
    brands: adminApi.brands,
    products: adminApi.products,
    productDetail: adminApi.productDetail,
    productMedia: (productId) => child("admin/products", productId, "media"),
    deliveryZones: resource("admin/delivery-zones"),
    couriers: resource("admin/couriers"),
    orders: adminApi.orders,
    orderDetail: adminApi.orderDetail,
    payments: resource("admin/payments"),
    shipments: adminApi.shipments,
    customers: adminApi.customers,
    reviews: adminApi.reviews,
    questions: adminApi.productQuestions,
    enquiries: adminApi.enquiries,
    returns: resource("admin/returns"),
    refunds: resource("admin/refunds"),
    invoices: adminApi.invoices,
    invoicePdf: adminApi.invoicePdf,
    analytics: resource("admin/analytics"),
    settings: adminApi.settings,
    notifications: adminApi.notifications,
    notificationsUnreadCount: adminApi.notificationsUnreadCount,
    notificationMarkRead: adminApi.notificationMarkRead,
    notificationsReadAll: adminApi.notificationsReadAll,
    auditLogs: resource("admin/audit-logs"),
  },
};
