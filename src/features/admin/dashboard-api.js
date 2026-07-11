"use client";

import { apiGet } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

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

function extractMetric(payload, candidatePaths = []) {
  for (const path of candidatePaths) {
    let current = payload;

    for (const key of path) {
      current = current?.[key];
    }

    const numeric = firstNumber(current);

    if (numeric !== null) {
      return numeric;
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

function extractCount(payload, candidatePaths = [], fallback = 0) {
  return extractMetric(payload, candidatePaths) ?? fallback;
}

function buildMetric(key, label, value, format = "number") {
  return {
    key,
    label,
    value,
    format,
  };
}

function normalizeOrder(item, index = 0) {
  return {
    id: firstString(item?.id, item?._id, item?.orderNumber, `order-${index}`) ?? `order-${index}`,
    orderNumber:
      firstString(item?.orderNumber, item?.number, item?.id, item?._id) ?? `AP-${index + 1}`,
    customerName:
      firstString(item?.customerName, item?.customer?.name, item?.shippingAddress?.fullName) ??
      "Customer",
    customerPhone:
      firstString(item?.customerPhone, item?.phone, item?.shippingAddress?.phone) ?? "—",
    amountMinor:
      firstNumber(item?.totalMinor, item?.total?.amount, item?.grandTotalMinor) ?? null,
    paymentMethod:
      firstString(item?.paymentMethod, item?.payment?.method, item?.paymentType) ?? "—",
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
    createdAt: firstString(item?.createdAt, item?.sentAt, item?.updatedAt),
    read: firstBoolean(item?.read, item?.isRead) ?? false,
  };
}

function normalizeProduct(item, index = 0) {
  const stock = firstNumber(item?.stockQuantity, item?.stock, item?.qty, item?.quantity) ?? 0;

  return {
    id: firstString(item?.id, item?._id, item?.sku, `product-${index}`) ?? `product-${index}`,
    name: firstString(item?.name, item?.title) ?? "Used auto part",
    sku: firstString(item?.sku, item?.partNumber) ?? "—",
    category: firstString(item?.category?.name, item?.categoryName) ?? "—",
    priceMinor: firstNumber(item?.priceMinor, item?.price?.amount, item?.salePriceMinor),
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

async function loadList(endpoint, query) {
  const result = await apiGet(endpoint, {
    query,
    credentials: "include",
  });
  return getEnvelopeData(result);
}

export async function getAdminNotificationPreview() {
  const payload = await loadList(endpoints.admin.notifications, {
    page: 1,
    limit: 6,
  });
  const items = normalizeItems(payload).map(normalizeNotification);

  return {
    items,
    unreadCount: items.filter((item) => !item.read).length,
  };
}

export async function getAdminDashboardData() {
  const [dashboardResult, notificationsResult] = await Promise.allSettled([
    loadList(endpoints.admin.dashboard),
    loadList(endpoints.admin.notifications, { page: 1, limit: 5 }),
  ]);

  const dashboardPayload =
    dashboardResult.status === "fulfilled" ? dashboardResult.value : {};
  const notificationsFromDashboard = extractCollection(dashboardPayload, [
    ["notifications"],
    ["recentNotifications"],
    ["summary", "notifications"],
  ]);
  const notifications =
    notificationsFromDashboard.length > 0
      ? notificationsFromDashboard.map(normalizeNotification)
      : notificationsResult.status === "fulfilled"
        ? normalizeItems(notificationsResult.value).map(normalizeNotification)
        : [];
  const orders = extractCollection(dashboardPayload, [
    ["recentOrders"],
    ["orders"],
    ["latestOrders"],
    ["summary", "recentOrders"],
  ]).map(normalizeOrder);
  const products = extractCollection(dashboardPayload, [
    ["recentProducts"],
    ["products"],
    ["latestProducts"],
    ["summary", "recentProducts"],
  ]).map(normalizeProduct);
  const lowStockProducts = extractCollection(dashboardPayload, [
    ["lowStockProducts"],
    ["lowStock"],
    ["summary", "lowStockProducts"],
    ["inventory", "lowStockProducts"],
  ])
    .map(normalizeProduct)
    .filter((product) => product.lowStock);
  const pendingShipments = extractCollection(dashboardPayload, [
    ["pendingShipments"],
    ["shipments", "pending"],
    ["summary", "pendingShipments"],
  ]).map((item, index) => normalizeSimpleRecord(item, index, "Shipment"));
  const pendingReturns = extractCollection(dashboardPayload, [
    ["pendingReturns"],
    ["returns", "pending"],
    ["summary", "pendingReturns"],
  ]).map((item, index) => normalizeSimpleRecord(item, index, "Return"));
  const pendingEnquiries = extractCollection(dashboardPayload, [
    ["pendingEnquiries"],
    ["enquiries", "pending"],
    ["summary", "pendingEnquiries"],
  ]).map((item, index) => normalizeSimpleRecord(item, index, "Enquiry"));

  const paidAmountMinor =
    extractMetric(dashboardPayload, [
      ["summary", "paidAmountMinor"],
      ["summary", "revenueMinor"],
      ["overview", "revenueMinor"],
      ["totals", "paidAmountMinor"],
      ["totals", "revenueMinor"],
      ["stats", "paidAmountMinor"],
      ["paidAmountMinor"],
      ["revenueMinor"],
    ]) ??
    orders.reduce((sum, order) => {
      if ((order.paymentStatus || "").toLowerCase().includes("paid")) {
        return sum + (order.amountMinor ?? 0);
      }

      return sum;
    }, 0);

  const totalOrders = extractCount(
    dashboardPayload,
    [
      ["summary", "totalOrders"],
      ["overview", "totalOrders"],
      ["totals", "orders"],
      ["stats", "orders"],
      ["totalOrders"],
    ],
    orders.length,
  );
  const codOrders = extractCount(
    dashboardPayload,
    [
      ["summary", "codOrders"],
      ["overview", "codOrders"],
      ["totals", "codOrders"],
      ["stats", "codOrders"],
      ["codOrders"],
    ],
    orders.filter((order) => (order.paymentMethod || "").toLowerCase().includes("cod")).length,
  );
  const totalProducts = extractCount(
    dashboardPayload,
    [
      ["summary", "totalProducts"],
      ["overview", "totalProducts"],
      ["totals", "products"],
      ["stats", "products"],
      ["totalProducts"],
    ],
    products.length,
  );
  const pendingShipmentsCount = extractCount(
    dashboardPayload,
    [
      ["summary", "pendingShipments"],
      ["overview", "pendingShipments"],
      ["totals", "pendingShipments"],
      ["stats", "pendingShipments"],
      ["pendingShipmentsCount"],
    ],
    pendingShipments.length,
  );
  const pendingReturnsCount = extractCount(
    dashboardPayload,
    [
      ["summary", "pendingReturns"],
      ["overview", "pendingReturns"],
      ["totals", "pendingReturns"],
      ["stats", "pendingReturns"],
      ["pendingReturnsCount"],
    ],
    pendingReturns.length,
  );
  const pendingEnquiriesCount = extractCount(
    dashboardPayload,
    [
      ["summary", "pendingEnquiries"],
      ["overview", "pendingEnquiries"],
      ["totals", "pendingEnquiries"],
      ["stats", "pendingEnquiries"],
      ["pendingEnquiriesCount"],
    ],
    pendingEnquiries.length,
  );
  const lowStockCount = extractCount(
    dashboardPayload,
    [
      ["summary", "lowStockProducts"],
      ["overview", "lowStockProducts"],
      ["totals", "lowStockProducts"],
      ["stats", "lowStockProducts"],
      ["lowStockCount"],
    ],
    lowStockProducts.length,
  );
  const orderStatusBreakdownSource = extractCollection(dashboardPayload, [
    ["orderStatusBreakdown"],
    ["summary", "orderStatusBreakdown"],
    ["statusBreakdown"],
  ]);
  const orderStatusBreakdown =
    orderStatusBreakdownSource.length > 0
      ? orderStatusBreakdownSource.map((item) => ({
          label: firstString(item?.label, item?.status, item?.key, item?.name) ?? "Pending",
          count: firstNumber(item?.count, item?.total, item?.value) ?? 0,
          percentage: firstNumber(item?.percentage) ?? 0,
        }))
      : buildStatusBreakdown(orders);

  return {
    metrics: [
      buildMetric("totalOrders", "Total Orders", totalOrders),
      buildMetric("codOrders", "COD Orders", codOrders),
      buildMetric("totalProducts", "Total Products", totalProducts),
      buildMetric("paidAmount", "Paid Amount", paidAmountMinor, "currency"),
      buildMetric("pendingShipments", "Pending Shipments", pendingShipmentsCount),
      buildMetric("pendingReturns", "Pending Returns", pendingReturnsCount),
      buildMetric("pendingEnquiries", "Pending Enquiries", pendingEnquiriesCount),
      buildMetric("lowStock", "Low Stock", lowStockCount),
    ],
    notifications,
    unreadNotifications: notifications.filter((item) => !item.read).length,
    recentOrders: orders,
    pendingShipments: pendingShipments.slice(0, 5),
    pendingReturns: pendingReturns.slice(0, 5),
    pendingEnquiries: pendingEnquiries.slice(0, 5),
    lowStockProducts: lowStockProducts.slice(0, 5),
    recentProducts: products.slice(0, 5),
    orderStatusBreakdown,
  };
}
