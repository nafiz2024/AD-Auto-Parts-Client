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
  const result = await apiGet(endpoint, { query });
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
  const [
    analyticsResult,
    notificationsResult,
    ordersResult,
    paymentsResult,
    shipmentsResult,
    returnsResult,
    enquiriesResult,
    productsResult,
  ] = await Promise.allSettled([
    loadList(endpoints.admin.analytics),
    loadList(endpoints.admin.notifications, { page: 1, limit: 5 }),
    loadList(endpoints.admin.orders, { page: 1, limit: 6 }),
    loadList(endpoints.admin.payments, { page: 1, limit: 12 }),
    loadList(endpoints.admin.shipments, { page: 1, limit: 12 }),
    loadList(endpoints.admin.returns, { page: 1, limit: 12 }),
    loadList(endpoints.admin.enquiries, { page: 1, limit: 12 }),
    loadList(endpoints.admin.products, { page: 1, limit: 12 }),
  ]);

  const analyticsPayload =
    analyticsResult.status === "fulfilled" ? analyticsResult.value : {};
  const notifications =
    notificationsResult.status === "fulfilled"
      ? normalizeItems(notificationsResult.value).map(normalizeNotification)
      : [];
  const orders =
    ordersResult.status === "fulfilled"
      ? normalizeItems(ordersResult.value).map(normalizeOrder)
      : [];
  const products =
    productsResult.status === "fulfilled"
      ? normalizeItems(productsResult.value).map(normalizeProduct)
      : [];
  const pendingPayments =
    paymentsResult.status === "fulfilled"
      ? normalizeItems(paymentsResult.value).filter((item) => {
          const status = firstString(item?.status, item?.paymentStatus) ?? "";
          return status.toLowerCase().includes("pending");
        })
      : [];
  const pendingShipments =
    shipmentsResult.status === "fulfilled"
      ? normalizeItems(shipmentsResult.value).filter((item) => {
          const status = firstString(item?.status, item?.shipmentStatus) ?? "";
          return !status.toLowerCase().includes("delivered");
        })
      : [];
  const pendingReturns =
    returnsResult.status === "fulfilled"
      ? normalizeItems(returnsResult.value).map((item, index) =>
          normalizeSimpleRecord(item, index, "Return"),
        )
      : [];
  const pendingEnquiries =
    enquiriesResult.status === "fulfilled"
      ? normalizeItems(enquiriesResult.value).map((item, index) =>
          normalizeSimpleRecord(item, index, "Enquiry"),
        )
      : [];

  const paidAmountMinor =
    extractMetric(analyticsPayload, [
      ["summary", "paidAmountMinor"],
      ["summary", "revenueMinor"],
      ["overview", "revenueMinor"],
      ["totals", "paidAmountMinor"],
      ["paidAmountMinor"],
      ["revenueMinor"],
    ]) ??
    orders.reduce((sum, order) => {
      if ((order.paymentStatus || "").toLowerCase().includes("paid")) {
        return sum + (order.amountMinor ?? 0);
      }

      return sum;
    }, 0);

  const totalOrders =
    extractMetric(analyticsPayload, [
      ["summary", "totalOrders"],
      ["overview", "totalOrders"],
      ["totals", "orders"],
      ["totalOrders"],
    ]) ?? orders.length;

  const lowStockProducts = products.filter((product) => product.lowStock);

  return {
    metrics: [
      {
        key: "totalOrders",
        label: "Total Orders",
        value: totalOrders,
        format: "number",
      },
      {
        key: "paidAmount",
        label: "Paid Amount",
        value: paidAmountMinor,
        format: "currency",
      },
      {
        key: "pendingPayments",
        label: "Pending Payments",
        value: pendingPayments.length,
        format: "number",
      },
      {
        key: "pendingShipments",
        label: "Pending Shipments",
        value: pendingShipments.length,
        format: "number",
      },
      {
        key: "pendingReturns",
        label: "Pending Returns",
        value: pendingReturns.length,
        format: "number",
      },
      {
        key: "pendingEnquiries",
        label: "Pending Enquiries",
        value: pendingEnquiries.length,
        format: "number",
      },
      {
        key: "lowStock",
        label: "Low Stock",
        value: lowStockProducts.length,
        format: "number",
      },
    ],
    notifications,
    unreadNotifications: notifications.filter((item) => !item.read).length,
    recentOrders: orders,
    pendingPayments: pendingPayments.slice(0, 5).map((item, index) =>
      normalizeSimpleRecord(item, index, "Payment"),
    ),
    pendingShipments: pendingShipments.slice(0, 5).map((item, index) =>
      normalizeSimpleRecord(item, index, "Shipment"),
    ),
    pendingReturns: pendingReturns.slice(0, 5),
    pendingEnquiries: pendingEnquiries.slice(0, 5),
    lowStockProducts: lowStockProducts.slice(0, 5),
    recentProducts: products.slice(0, 5),
    orderStatusBreakdown: buildStatusBreakdown(orders),
  };
}
