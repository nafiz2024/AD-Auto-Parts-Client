"use client";

import { apiGet, apiPatch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

const ADMIN_DASHBOARD_REFRESH_EVENT = "admin-dashboard:refresh";

function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function firstNumber(...values) {
  for (const value of values) {
    const numeric = Number(value);

    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return null;
}

function firstBoolean(...values) {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
  }

  return null;
}

function normalizeItems(payload) {
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

function getEnvelopeData(result) {
  return result?.data ?? result?.raw ?? result ?? {};
}

function extractValue(payload, candidatePaths = []) {
  for (const path of candidatePaths) {
    let current = payload;

    for (const key of path) {
      current = current?.[key];
    }

    if (current !== undefined && current !== null) {
      return current;
    }
  }

  return null;
}

function extractCollection(payload, candidatePaths = []) {
  for (const path of candidatePaths) {
    let current = payload;

    for (const key of path) {
      current = current?.[key];
    }

    const items = normalizeItems(current);

    if (items.length > 0) {
      return items;
    }
  }

  return [];
}

function emitRefreshEvent() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(ADMIN_DASHBOARD_REFRESH_EVENT));
}

export function subscribeToAdminDashboardRefresh(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(ADMIN_DASHBOARD_REFRESH_EVENT, callback);

  return () => {
    window.removeEventListener(ADMIN_DASHBOARD_REFRESH_EVENT, callback);
  };
}

export function requestAdminDashboardRefresh() {
  emitRefreshEvent();
}

function buildMetric(key, label, value, format = "number") {
  return {
    key,
    label,
    value,
    format,
  };
}

function normalizeCount(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeOrder(item, index = 0) {
  const minorAmount = firstNumber(
    item?.totalMinor,
    item?.grandTotalMinor,
    item?.amountMinor,
    item?.total?.amountMinor,
    item?.totalAmountMinor,
  );
  const majorAmount = firstNumber(
    item?.total,
    item?.totalAmount,
    item?.grandTotal,
    item?.amount,
    item?.total?.amount,
  );

  return {
    id: firstString(item?.id, item?._id, item?.orderNumber, `order-${index}`) ?? `order-${index}`,
    orderNumber:
      firstString(item?.orderNumber, item?.number, item?.id, item?._id) ?? `AP-${index + 1}`,
    customerName:
      firstString(item?.customerName, item?.customer?.name, item?.shippingAddress?.fullName) ??
      "Customer",
    customerPhone:
      firstString(item?.customerPhone, item?.phone, item?.shippingAddress?.phone) ?? "--",
    amountMinor: minorAmount ?? (majorAmount !== null ? Math.round(majorAmount * 100) : null),
    paymentMethod:
      firstString(item?.paymentMethod, item?.payment?.method, item?.paymentType) ?? "--",
    paymentStatus:
      firstString(item?.paymentStatus, item?.payment?.status) ?? "Pending",
    orderStatus: firstString(item?.status, item?.orderStatus) ?? "Pending",
    createdAt: firstString(item?.createdAt, item?.placedAt, item?.updatedAt),
  };
}

function normalizeNotification(item, index = 0) {
  return {
    id: firstString(item?.id, item?._id, `notification-${index}`) ?? `notification-${index}`,
    title: firstString(item?.title, item?.subject, item?.type) ?? "Notification",
    message: firstString(item?.message, item?.body, item?.content) ?? "",
    type: firstString(item?.type, item?.category, item?.channel) ?? "general",
    createdAt: firstString(item?.createdAt, item?.sentAt, item?.updatedAt),
    read: firstBoolean(item?.read, item?.isRead) ?? false,
  };
}

function normalizeProduct(item, index = 0) {
  const stock = firstNumber(item?.stockQuantity, item?.stock, item?.qty, item?.quantity) ?? 0;
  const priceMinor = firstNumber(
    item?.priceMinor,
    item?.price?.amountMinor,
    item?.salePriceMinor,
  );
  const priceMajor = firstNumber(item?.price, item?.price?.amount, item?.salePrice);

  return {
    id: firstString(item?.id, item?._id, item?.sku, `product-${index}`) ?? `product-${index}`,
    name: firstString(item?.name, item?.title) ?? "Used auto part",
    sku: firstString(item?.sku, item?.partNumber) ?? "--",
    category: firstString(item?.category?.name, item?.categoryName) ?? "--",
    priceMinor: priceMinor ?? (priceMajor !== null ? Math.round(priceMajor * 100) : null),
    stockQuantity: stock,
    status:
      firstString(item?.status, item?.inventoryStatus, item?.availabilityStatus) ?? "Draft",
    lowStock: stock > 0 && stock <= 5,
  };
}

function normalizeSimpleRecord(item, index = 0, fallbackLabel) {
  return {
    id: firstString(item?.id, item?._id, `item-${index}`) ?? `item-${index}`,
    title: firstString(item?.title, item?.subject, item?.status, fallbackLabel) ?? fallbackLabel,
    status: firstString(item?.status, item?.paymentStatus, item?.shipmentStatus) ?? "Pending",
    createdAt: firstString(item?.createdAt, item?.submittedAt, item?.updatedAt),
  };
}

function buildStatusBreakdown(orders) {
  const counts = new Map();

  for (const order of orders) {
    const label = order.orderStatus || "Pending";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const total = Array.from(counts.values()).reduce((sum, value) => sum + value, 0);

  return Array.from(counts.entries()).map(([label, count]) => ({
    label,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
}

function normalizeStatusBreakdown(items, orders) {
  if (items.length === 0) {
    return buildStatusBreakdown(orders);
  }

  return items.map((item) => ({
    label: firstString(item?.label, item?.status, item?.key, item?.name) ?? "Pending",
    count: firstNumber(item?.count, item?.total, item?.value) ?? 0,
    percentage: firstNumber(item?.percentage) ?? 0,
  }));
}

function normalizePaidAmountMinor(payload) {
  const directMinor = firstNumber(extractValue(payload, [["paidAmountMinor"]]));

  if (directMinor !== null) {
    return directMinor;
  }

  return Number(extractValue(payload, [["paidAmount"]]) || 0);
}

async function loadSummary() {
  const result = await apiGet(endpoints.admin.dashboardSummary, {
    credentials: "include",
  });

  const summary = result?.raw?.data ?? result?.data ?? result?.raw ?? {};

  if (process.env.NODE_ENV !== "production") {
    console.log("[admin dashboard] summary data:", summary);
  }

  return summary;
}

export async function getAdminDashboardData() {
  const payload = await loadSummary();

  const notifications = extractCollection(payload, [
    ["recentNotifications"],
    ["notifications"],
  ]).map(normalizeNotification);
  const orders = extractCollection(payload, [
    ["recentOrders"],
    ["orders"],
  ]).map(normalizeOrder);
  const products = extractCollection(payload, [
    ["recentProducts"],
    ["products"],
  ]).map(normalizeProduct);
  const lowStockProducts = extractCollection(payload, [
    ["lowStockProducts"],
    ["lowStockItems"],
  ])
    .map(normalizeProduct)
    .filter((product) => product.lowStock);
  const pendingShipments = extractCollection(payload, [
    ["pendingShipmentItems"],
    ["pendingShipmentsList"],
  ]).map((item, index) => normalizeSimpleRecord(item, index, "Shipment"));
  const pendingReturns = extractCollection(payload, [
    ["pendingReturnItems"],
    ["pendingReturnsList"],
  ]).map((item, index) => normalizeSimpleRecord(item, index, "Return"));
  const pendingEnquiries = extractCollection(payload, [
    ["pendingEnquiryItems"],
    ["pendingEnquiriesList"],
  ]).map((item, index) => normalizeSimpleRecord(item, index, "Enquiry"));

  const totalOrders = normalizeCount(extractValue(payload, [["totalOrders"]]), orders.length);
  const codOrders = normalizeCount(
    extractValue(payload, [["codOrders"]]),
    orders.filter((order) => (order.paymentMethod || "").toLowerCase().includes("cod")).length,
  );
  const totalProducts = normalizeCount(
    extractValue(payload, [["totalProducts"]]),
    products.length,
  );
  const pendingShipmentsCount = normalizeCount(
    extractValue(payload, [["pendingShipments"]]),
    pendingShipments.length,
  );
  const pendingReturnsCount = normalizeCount(
    extractValue(payload, [["pendingReturns"]]),
    pendingReturns.length,
  );
  const pendingEnquiriesCount = normalizeCount(
    extractValue(payload, [["pendingEnquiries"]]),
    pendingEnquiries.length,
  );
  const lowStockCount = normalizeCount(
    extractValue(payload, [["lowStock"]]),
    lowStockProducts.length,
  );
  const unreadNotifications = normalizeCount(
    extractValue(payload, [["unreadNotifications"]]),
    notifications.filter((item) => !item.read).length,
  );
  const orderStatusBreakdown = normalizeStatusBreakdown(
    extractCollection(payload, [["orderStatusBreakdown"], ["statusBreakdown"]]),
    orders,
  );

  return {
    metrics: [
      buildMetric("totalOrders", "Total Orders", totalOrders),
      buildMetric("codOrders", "COD Orders", codOrders),
      buildMetric("totalProducts", "Total Products", totalProducts),
      buildMetric("paidAmount", "Paid Amount", normalizePaidAmountMinor(payload), "currency"),
      buildMetric("pendingShipments", "Pending Shipments", pendingShipmentsCount),
      buildMetric("pendingReturns", "Pending Returns", pendingReturnsCount),
      buildMetric("pendingEnquiries", "Pending Enquiries", pendingEnquiriesCount),
      buildMetric("lowStock", "Low Stock", lowStockCount),
    ],
    notifications,
    unreadNotifications,
    summaryCounts: {
      pendingShipments: pendingShipmentsCount,
      pendingReturns: pendingReturnsCount,
      pendingEnquiries: pendingEnquiriesCount,
      lowStock: lowStockCount,
    },
    recentOrders: orders,
    pendingShipments: pendingShipments.slice(0, 5),
    pendingReturns: pendingReturns.slice(0, 5),
    pendingEnquiries: pendingEnquiries.slice(0, 5),
    lowStockProducts: lowStockProducts.slice(0, 5),
    recentProducts: products.slice(0, 5),
    orderStatusBreakdown,
  };
}

export async function markAdminNotificationRead(notificationId) {
  await apiPatch(endpoints.admin.notificationMarkRead(notificationId), undefined, {
    credentials: "include",
  });
  emitRefreshEvent();
}

export async function markAllAdminNotificationsRead() {
  await apiPatch(endpoints.admin.notificationsReadAll, undefined, {
    credentials: "include",
  });
  emitRefreshEvent();
}
