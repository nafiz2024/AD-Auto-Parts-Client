import { apiGet, apiPatch, apiPost, resolveApiRequestUrl } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import {
  asArray,
  firstBoolean,
  firstNumber,
  firstString,
  getEnvelopeData,
  normalizeAddress,
  normalizeItems,
  normalizeMinorAmount,
  normalizePagination,
  normalizeStatusOptions,
  normalizeTimelineEntry,
  sanitizeDisplayUrl,
  uniqueBy,
} from "@/features/admin/order-workflow/admin-workflow-utils";

const DEFAULT_PAGE_SIZE = 10;
const ADMIN_ORDER_REQUEST_OPTIONS = {
  credentials: "include",
};
const SHOP_PICKUP_METHODS = new Set(["shop_pickup", "shop_receive"]);
const DEFAULT_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];
const DEFAULT_SHIPMENT_STATUSES = [
  "pending",
  "assigned",
  "dispatched",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "failed",
  "returned",
];
const IS_DEVELOPMENT = process.env.NODE_ENV !== "production";

function orderActionPath(orderId, action) {
  return `${endpoints.admin.orderDetail(orderId)}/${action}`;
}

function orderStatusPath(orderId) {
  return orderActionPath(orderId, "status");
}

function orderCancelPath(orderId) {
  return orderActionPath(orderId, "cancel");
}

function orderShipmentPath(orderId) {
  return orderActionPath(orderId, "shipment");
}

function orderPaymentStatusPath(orderId) {
  return orderActionPath(orderId, "payment-status");
}

function logAdminOrderAction(url, payload, responseStatus, responseData) {
  if (!IS_DEVELOPMENT) {
    return;
  }

  console.log("[admin order action]", url, payload, responseStatus, responseData);
}

function normalizeOrderIdentifierValue(value) {
  return firstString(value);
}

function toDisplayLabel(value, fallback = "Pending") {
  const source = firstString(value) ?? fallback;

  return source
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function normalizeOrderStatus(value) {
  const normalized = (firstString(value) ?? "pending").toLowerCase();

  if (normalized.includes("cancel")) {
    return "cancelled";
  }

  if (normalized.includes("return")) {
    return "returned";
  }

  return normalized.replace(/\s+/g, "_");
}

function normalizePaymentStatus(value) {
  const normalized = (firstString(value) ?? "pending").toLowerCase();

  if (normalized.includes("unpaid")) {
    return "unpaid";
  }

  if (normalized.includes("refund")) {
    return "refunded";
  }

  if (normalized.includes("reject")) {
    return "rejected";
  }

  if (normalized.includes("paid")) {
    return "paid";
  }

  return normalized.replace(/\s+/g, "_");
}

function normalizeShipmentStatus(value) {
  const normalized = firstString(value);

  if (!normalized) {
    return "";
  }

  return normalized.toLowerCase().replace(/\s+/g, "_");
}

function normalizeFulfillmentMethod(value) {
  return (firstString(value) ?? "").toLowerCase().replace(/\s+/g, "_");
}

function isShopPickupFulfillmentMethod(value) {
  return SHOP_PICKUP_METHODS.has(normalizeFulfillmentMethod(value));
}

function normalizePaymentMethod(value) {
  return (firstString(value) ?? "").toLowerCase().replace(/\s+/g, "_");
}

function normalizeMajorAmountToMinor(...values) {
  const amount = firstNumber(...values);
  return amount === null ? null : Math.round(amount * 100);
}

function resolveBackendMessage(data) {
  if (!data) {
    return null;
  }

  if (typeof data === "string") {
    const trimmed = data.trim();
    return trimmed && trimmed !== "[object Object]" ? trimmed : null;
  }

  if (typeof data !== "object") {
    return null;
  }

  const directMessage = firstString(data.message, data.error);

  if (directMessage && directMessage !== "[object Object]") {
    return directMessage;
  }

  const firstError = asArray(data.errors)[0];
  const firstErrorMessage = firstString(firstError?.message, firstError?.error, firstError);
  return firstErrorMessage && firstErrorMessage !== "[object Object]" ? firstErrorMessage : null;
}

function resolveOrderState(item) {
  const fulfillmentMethod = normalizeFulfillmentMethod(
    item?.fulfillmentMethod ??
      item?.deliveryMethod ??
      item?.shippingMethod ??
      item?.shipment?.method ??
      item?.shipment?.fulfillmentMethod,
  );
  const rawOrderStatus = firstString(item?.status, item?.orderStatus) ?? "pending";
  const rawPaymentStatus = firstString(
    item?.paymentStatus,
    item?.payment?.status,
    item?.payment_state,
  ) ?? "pending";
  const rawShipmentStatus = firstString(
    item?.shipmentStatus,
    item?.shipment?.status,
    item?.deliveryStatus,
  );
  const rawDeliveryStatus = firstString(item?.deliveryStatus, item?.delivery?.status);
  const rawPickupStatus = firstString(item?.pickupStatus, item?.pickup?.status);
  const orderStatus = normalizeOrderStatus(rawOrderStatus);
  const paymentStatus = normalizePaymentStatus(rawPaymentStatus);
  const deliveryStatus = normalizeShipmentStatus(rawDeliveryStatus);
  const pickupStatus = normalizeShipmentStatus(rawPickupStatus);
  let shipmentStatus = normalizeShipmentStatus(rawShipmentStatus);
  let shipmentStatusLabel = firstString(
    item?.shipmentStatusLabel,
    item?.shipment?.statusLabel,
    item?.shipment?.status,
    item?.shipmentStatus,
  );

  if (isShopPickupFulfillmentMethod(fulfillmentMethod)) {
    const pickupComplete =
      pickupStatus === "picked_up" ||
      pickupStatus === "completed" ||
      pickupStatus === "complete" ||
      orderStatus === "picked_up" ||
      orderStatus === "delivered" ||
      orderStatus === "completed" ||
      deliveryStatus === "delivered";

    if (pickupComplete) {
      shipmentStatus = "picked_up";
      shipmentStatusLabel = "Picked Up";
    } else {
      shipmentStatus = "not_required";
      shipmentStatusLabel = "Shop Pickup";
    }
  } else if (
    orderStatus === "delivered" ||
    deliveryStatus === "delivered" ||
    shipmentStatus === "delivered"
  ) {
    shipmentStatus = "delivered";
    shipmentStatusLabel = "Delivered";
  } else if (!shipmentStatus) {
    shipmentStatus = "pending";
    shipmentStatusLabel = "Pending";
  } else if (!shipmentStatusLabel) {
    shipmentStatusLabel = toDisplayLabel(shipmentStatus, "Pending");
  }

  return {
    fulfillmentMethod,
    fulfillmentMethodLabel: fulfillmentMethod ? toDisplayLabel(fulfillmentMethod) : "—",
    orderStatus,
    orderStatusLabel:
      firstString(item?.statusLabel, item?.orderStatusLabel) ??
      (orderStatus === "picked_up" ? "Picked Up" : toDisplayLabel(orderStatus, "Pending")),
    paymentStatus,
    paymentStatusLabel:
      firstString(item?.paymentStatusLabel, item?.payment?.statusLabel, item?.payment?.status) ??
      toDisplayLabel(paymentStatus, "Pending"),
    shipmentStatus,
    shipmentStatusLabel,
    deliveryStatus,
    pickupStatus,
    isShopPickup: isShopPickupFulfillmentMethod(fulfillmentMethod),
  };
}

function normalizeOrderSummary(item, index = 0) {
  const orderState = resolveOrderState(item);
  const customerName = firstString(
    item?.customer?.name,
    item?.customerName,
    item?.shippingAddress?.fullName,
    item?.billingAddress?.fullName,
  ) ?? "Customer";
  const customerPhone = firstString(
    item?.customer?.phone,
    item?.customerPhone,
    item?.shippingAddress?.phone,
  ) ?? "—";
  const customerEmail = firstString(
    item?.customer?.email,
    item?.customerEmail,
    item?.email,
  ) ?? "";

  return {
    id:
      firstString(item?.id, item?._id, item?.orderNumber, `order-${index}`) ??
      `order-${index}`,
    orderNumber:
      firstString(item?.orderNumber, item?.number, item?.id, item?._id) ??
      `ORD-${index + 1}`,
    customerName,
    customerPhone,
    customerEmail,
    customerSummary: customerEmail || customerPhone,
    itemCount:
      firstNumber(item?.itemCount, item?.itemsCount, item?.quantity, item?.totalItems) ?? 0,
    totalMinor: normalizeMinorAmount(
      item?.totalMinor,
      item?.total?.amountMinor,
      item?.total?.amount,
      item?.grandTotalMinor,
      item?.grandTotal,
    ) ?? 0,
    subtotalMinor: normalizeMinorAmount(
      item?.subtotalMinor,
      item?.subTotalMinor,
      item?.subtotal?.amountMinor,
      item?.subtotal?.amount,
    ),
    paymentMethod:
      firstString(item?.paymentMethod, item?.payment?.method, item?.paymentType) ??
      "—",
    fulfillmentMethod: orderState.fulfillmentMethodLabel,
    fulfillmentMethodValue: orderState.fulfillmentMethod,
    paymentStatus: orderState.paymentStatus,
    paymentStatusLabel: orderState.paymentStatusLabel,
    orderStatus: orderState.orderStatus,
    orderStatusLabel: orderState.orderStatusLabel,
    shipmentStatus: orderState.shipmentStatus,
    shipmentStatusLabel: orderState.shipmentStatusLabel,
    deliveryStatus: orderState.deliveryStatus,
    pickupStatus: orderState.pickupStatus,
    isShopPickup: orderState.isShopPickup,
    createdAt: firstString(item?.createdAt, item?.placedAt, item?.date, item?.updatedAt),
    invoiceNumber: firstString(item?.invoiceNumber, item?.invoice?.invoiceNumber),
    invoiceUrl: sanitizeDisplayUrl(item?.invoiceUrl ?? item?.invoice?.pdfUrl),
    canCreateShipment:
      firstBoolean(
        item?.canCreateShipment,
        item?.availableActions?.canCreateShipment,
        item?.actions?.canCreateShipment,
      ) ?? false,
    canCancel:
      firstBoolean(
        item?.canCancel,
        item?.availableActions?.canCancel,
        item?.actions?.canCancel,
      ) ?? false,
  };
}

function normalizeOrderItem(item, index = 0) {
  return {
    id:
      firstString(item?.id, item?._id, item?.productId, item?.sku, `item-${index}`) ??
      `item-${index}`,
    productId: firstString(item?.productId, item?.product?.id, item?.product?._id) ?? "",
    productSlug: firstString(item?.productSlug, item?.product?.slug) ?? "",
    productName:
      firstString(item?.productName, item?.product?.name, item?.name, item?.title) ??
      "Used auto part",
    sku: firstString(item?.sku, item?.product?.sku, item?.partNumber) ?? "—",
    quantity: firstNumber(item?.quantity, item?.qty, item?.count) ?? 1,
    priceMinor: normalizeMinorAmount(
      item?.priceMinor,
      item?.unitPriceMinor,
      item?.price?.amountMinor,
      item?.price?.amount,
    ) ?? 0,
    totalMinor: normalizeMinorAmount(
      item?.totalMinor,
      item?.lineTotalMinor,
      item?.total?.amountMinor,
      item?.total?.amount,
    ) ?? 0,
    imageUrl: sanitizeDisplayUrl(
      item?.imageUrl ??
        item?.product?.primaryImageUrl ??
        item?.product?.imageUrl ??
        item?.product?.thumbnailUrl,
    ),
    compatibilitySummary:
      firstString(item?.compatibilitySummary, item?.vehicleSummary, item?.fitmentSummary) ?? "",
  };
}

function normalizeManualPaymentSubmission(item, index = 0) {
  return {
    id:
      firstString(item?.id, item?._id, item?.referenceNumber, `payment-${index}`) ??
      `payment-${index}`,
    status: normalizePaymentStatus(item?.status ?? item?.paymentStatus),
    statusLabel: firstString(item?.statusLabel, item?.status, item?.paymentStatus) ?? "Pending",
    amountMinor: normalizeMinorAmount(
      item?.amountMinor,
      item?.amount?.amountMinor,
      item?.amount?.amount,
      item?.submittedAmountMinor,
    ),
    paymentDate: firstString(item?.paymentDate, item?.submittedAt, item?.createdAt),
    referenceNumber:
      firstString(item?.referenceNumber, item?.transactionReference, item?.transactionId) ?? "",
    note: firstString(item?.note, item?.notes, item?.message) ?? "",
    proofUrl: sanitizeDisplayUrl(
      item?.proofUrl ?? item?.safeProofUrl ?? item?.downloadUrl ?? item?.previewUrl,
    ),
  };
}

function normalizeShipment(item, index = 0) {
  return {
    id:
      firstString(item?.id, item?._id, item?.shipmentNumber, `shipment-${index}`) ??
      `shipment-${index}`,
    shipmentNumber:
      firstString(item?.shipmentNumber, item?.trackingNumber, item?.reference) ??
      `SHP-${index + 1}`,
    courier: firstString(item?.courier?.name, item?.courierName, item?.courier) ?? "—",
    courierId: firstString(item?.courierId, item?.courier?.id, item?.courier?._id) ?? "",
    trackingNumber: firstString(item?.trackingNumber, item?.trackingCode) ?? "",
    status: normalizeShipmentStatus(item?.status ?? item?.shipmentStatus),
    statusLabel:
      firstString(item?.statusLabel, item?.status, item?.shipmentStatus) ?? "Pending",
    estimatedDelivery:
      firstString(item?.estimatedDeliveryDate, item?.estimatedDelivery, item?.eta) ?? "",
    note: firstString(item?.note, item?.shipmentNote, item?.description) ?? "",
    createdAt: firstString(item?.createdAt, item?.assignedAt, item?.updatedAt),
  };
}

function normalizeNoteEntry(item, index = 0) {
  return {
    id: firstString(item?.id, item?._id, `note-${index}`) ?? `note-${index}`,
    body: firstString(item?.body, item?.note, item?.message, item?.content) ?? "",
    author: firstString(item?.author?.name, item?.createdBy?.name, item?.authorName) ?? "",
    createdAt: firstString(item?.createdAt, item?.updatedAt),
  };
}

function normalizeStatusCounts(payload, items) {
  const summary =
    payload?.statusCounts ??
    payload?.summary?.statusCounts ??
    payload?.meta?.statusCounts ??
    payload?.meta?.summary?.statusCounts;
  const countsMap = new Map();

  asArray(summary).forEach((entry) => {
    const key = normalizeOrderStatus(entry?.status ?? entry?.key ?? entry?.value);
    const count = firstNumber(entry?.count, entry?.total, entry?.value) ?? 0;

    if (key) {
      countsMap.set(key, count);
    }
  });

  if (countsMap.size === 0) {
    items.forEach((item) => {
      countsMap.set(item.orderStatus, (countsMap.get(item.orderStatus) ?? 0) + 1);
    });
  }

  const totalCount = Array.from(countsMap.values()).reduce((sum, value) => sum + value, 0);
  const allCount =
    firstNumber(
      payload?.meta?.totalItems,
      payload?.meta?.total,
      payload?.summary?.totalOrders,
      totalCount,
    ) ?? totalCount;

  return [
    { key: "all", label: "All", count: allCount },
    ...DEFAULT_ORDER_STATUSES
      .filter((status) => countsMap.has(status))
      .map((status) => ({
        key: status,
        label: status,
        count: countsMap.get(status) ?? 0,
      })),
  ];
}

function normalizeCourierOption(item, index = 0) {
  return {
    id: firstString(item?.id, item?._id, item?.code, `courier-${index}`) ?? `courier-${index}`,
    name: firstString(item?.name, item?.title, item?.label, item?.code) ?? "Courier",
  };
}

export async function getAdminOrders(filters = {}) {
  const query = {
    page: filters.page ?? 1,
    limit: filters.limit ?? DEFAULT_PAGE_SIZE,
    search:
      filters.orderNumber ||
      filters.customerPhone ||
      filters.customerEmail ||
      filters.q ||
      undefined,
    orderStatus: filters.status || undefined,
    paymentStatus: filters.paymentStatus || undefined,
    fulfillmentMethod: filters.fulfillmentMethod || undefined,
    shipmentStatus: filters.shipmentStatus || undefined,
    createdFrom: filters.dateFrom || undefined,
    createdTo: filters.dateTo || undefined,
    minTotalMinor: filters.minAmount || undefined,
    maxTotalMinor: filters.maxAmount || undefined,
  };

  const result = await apiGet(endpoints.admin.orders, {
    ...ADMIN_ORDER_REQUEST_OPTIONS,
    query,
  });
  const payload = getEnvelopeData(result);
  const items = normalizeItems(payload).map(normalizeOrderSummary);

  return {
    items,
    pagination: normalizePagination(payload?.meta ?? result?.meta, query.page, query.limit),
    statusTabs: normalizeStatusCounts(payload, items),
  };
}

export async function getAdminOrderDetail(orderNumber) {
  const result = await apiGet(endpoints.admin.orderDetail(orderNumber), {
    ...ADMIN_ORDER_REQUEST_OPTIONS,
    cache: "no-store",
  });
  const payload = getEnvelopeData(result);
  const item = payload?.order ?? payload?.data ?? payload;
  const orderState = resolveOrderState(item);

  const summary = normalizeOrderSummary(item);
  const orderItems = uniqueBy(
    asArray(item?.items).map(normalizeOrderItem),
    (entry) => entry.id,
  );
  const manualPayments = uniqueBy(
    asArray(item?.manualPayments ?? item?.paymentSubmissions).map(
      normalizeManualPaymentSubmission,
    ),
    (entry) => entry.id,
  );
  const shipments = uniqueBy(
    asArray(item?.shipments ?? item?.deliveryShipments).map(normalizeShipment),
    (entry) => entry.id,
  );
  const timeline = uniqueBy(
    [
      ...asArray(item?.timeline),
      ...asArray(item?.history),
      ...asArray(item?.statusHistory),
      ...shipments.map((shipment) => ({
        status: shipment.statusLabel,
        description: shipment.note,
        createdAt: shipment.createdAt,
        trackingNumber: shipment.trackingNumber,
      })),
    ]
      .map(normalizeTimelineEntry)
      .filter((entry) => entry.status || entry.description),
    (entry) => `${entry.status}-${entry.createdAt}-${entry.description}`,
  );
  const adminNotes = uniqueBy(
    asArray(item?.adminNotes ?? item?.notes).map(normalizeNoteEntry),
    (entry) => entry.id,
  );

  return {
    ...summary,
    _id: firstString(item?._id),
    status: orderState.orderStatus,
    fulfillmentMethod: orderState.fulfillmentMethod,
    fulfillmentMethodLabel: orderState.fulfillmentMethodLabel,
    paymentStatus: orderState.paymentStatus,
    paymentStatusLabel: orderState.paymentStatusLabel,
    shipmentStatus: orderState.shipmentStatus,
    shipmentStatusLabel: orderState.shipmentStatusLabel,
    deliveryStatus: orderState.deliveryStatus,
    pickupStatus: orderState.pickupStatus,
    orderStatus: orderState.orderStatus,
    orderStatusLabel: orderState.orderStatusLabel,
    isShopPickup: orderState.isShopPickup,
    orderedItems: orderItems,
    customer: {
      name: summary.customerName,
      phone: summary.customerPhone,
      email: summary.customerEmail,
    },
    shippingAddress:
      normalizeAddress(item?.shippingAddress) ??
      normalizeAddress(item?.deliveryAddress) ??
      null,
    billingAddress: normalizeAddress(item?.billingAddress) ?? null,
    vehicle: {
      make: firstString(
        item?.vehicle?.make,
        item?.compatibility?.make,
        item?.vehicleCompatibility?.make,
      ),
      model: firstString(
        item?.vehicle?.model,
        item?.compatibility?.model,
        item?.vehicleCompatibility?.model,
      ),
      year: firstString(
        item?.vehicle?.year,
        item?.compatibility?.year,
        item?.vehicleCompatibility?.year,
      ),
      engine: firstString(
        item?.vehicle?.engine,
        item?.compatibility?.engine,
        item?.vehicleCompatibility?.engine,
      ),
    },
    payment: {
      method: normalizePaymentMethod(summary.paymentMethod),
      methodLabel: summary.paymentMethod,
      status: orderState.paymentStatus,
      statusLabel: orderState.paymentStatusLabel,
      subtotalMinor:
        summary.subtotalMinor ??
        normalizeMinorAmount(
          item?.subtotalMinor,
          item?.subTotalMinor,
          item?.subtotal?.amountMinor,
          item?.subtotal?.amount,
        ),
      deliveryMinor:
        normalizeMinorAmount(
          item?.deliveryFeeMinor,
          item?.deliveryChargeMinor,
          item?.shippingFeeMinor,
        ) ??
        normalizeMajorAmountToMinor(
          item?.deliveryFee,
          item?.deliveryCharge,
          item?.shippingFee,
          item?.delivery?.amount,
          item?.shipping?.amount,
        ) ??
        0,
      discountMinor: normalizeMinorAmount(item?.discountMinor, item?.discount?.amountMinor) ?? 0,
      totalMinor: summary.totalMinor,
      transactionReference: firstString(
        item?.transactionReference,
        item?.payment?.transactionReference,
        item?.payment?.transactionId,
      ),
    },
    manualPayments,
    shipments,
    timeline,
    adminNotes,
    latestAdminNote: adminNotes[0]?.body ?? "",
    invoice: {
      invoiceNumber: summary.invoiceNumber,
      url: summary.invoiceUrl,
      canCreate:
        firstBoolean(
          item?.canCreateInvoice,
          item?.availableActions?.canCreateInvoice,
          item?.actions?.canCreateInvoice,
        ) ?? false,
    },
    availableActions: {
      canCancel:
        summary.canCancel ||
        (orderState.orderStatus !== "cancelled" &&
          orderState.orderStatus !== "delivered" &&
          orderState.orderStatus !== "picked_up"),
      canCreateShipment:
        !orderState.isShopPickup &&
        (summary.canCreateShipment ||
          shipments.length === 0 ||
          orderState.orderStatus === "processing" ||
          orderState.orderStatus === "confirmed"),
      canUpdateStatus: true,
      canSaveNote:
        firstBoolean(
          item?.canSaveNote,
          item?.availableActions?.canSaveNote,
          item?.actions?.canSaveNote,
        ) ?? true,
    },
    availableOrderStatuses: normalizeStatusOptions(
      item?.availableOrderStatuses ?? item?.allowedTransitions?.orderStatus,
      DEFAULT_ORDER_STATUSES,
    ),
    availableShipmentStatuses: normalizeStatusOptions(
      item?.availableShipmentStatuses ?? item?.allowedTransitions?.shipmentStatus,
      DEFAULT_SHIPMENT_STATUSES,
    ),
  };
}

export function resolveAdminOrderIdentifier(order, routeOrderNumber) {
  return (
    normalizeOrderIdentifierValue(order?.id) ||
    normalizeOrderIdentifierValue(order?._id) ||
    normalizeOrderIdentifierValue(order?.orderNumber) ||
    normalizeOrderIdentifierValue(routeOrderNumber)
  );
}

export async function updateAdminOrderStatus(orderIdentifier, payload) {
  const normalizedIdentifier = resolveAdminOrderIdentifier({ id: orderIdentifier }, orderIdentifier);
  const normalizedPayload = {
    status: normalizeOrderStatus(payload?.status),
    note: firstString(payload?.note) ?? "",
  };
  const path = orderStatusPath(normalizedIdentifier);
  const url = resolveApiRequestUrl(path);

  try {
    const result = await apiPatch(path, normalizedPayload, ADMIN_ORDER_REQUEST_OPTIONS);
    const data = getEnvelopeData(result);
    logAdminOrderAction(url, normalizedPayload, result?.status, data);
    return data;
  } catch (error) {
    logAdminOrderAction(
      url,
      normalizedPayload,
      error?.status ?? null,
      error?.details ?? error?.message ?? null,
    );
    throw error;
  }
}

export async function cancelAdminOrder(orderNumber, payload) {
  const result = await apiPatch(orderCancelPath(orderNumber), payload, ADMIN_ORDER_REQUEST_OPTIONS);
  return getEnvelopeData(result);
}

export async function saveAdminOrderNote(orderNumber, note) {
  const result = await apiPatch(
    endpoints.admin.orderDetail(orderNumber),
    {
      action: "save_note",
      adminNote: note,
    },
    ADMIN_ORDER_REQUEST_OPTIONS,
  );
  return getEnvelopeData(result);
}

export async function createAdminShipmentFromOrder(orderIdentifier, payload) {
  const normalizedPayload = {
    courier: firstString(payload?.courier) ?? "Shop",
    trackingNumber: firstString(payload?.trackingNumber) ?? "",
    estimatedDeliveryDate: firstString(payload?.estimatedDeliveryDate) ?? null,
    note: firstString(payload?.note) ?? "",
  };
  const path = orderShipmentPath(orderIdentifier);
  const url = resolveApiRequestUrl(path);

  try {
    const result = await apiPost(path, normalizedPayload, ADMIN_ORDER_REQUEST_OPTIONS);
    const data = getEnvelopeData(result);
    logAdminOrderAction(url, normalizedPayload, result?.status, data);
    return data;
  } catch (error) {
    logAdminOrderAction(
      url,
      normalizedPayload,
      error?.status ?? null,
      error?.details ?? error?.message ?? null,
    );
    throw error;
  }
}

export async function updateAdminOrderPaymentStatus(orderIdentifier, payload) {
  const normalizedPayload = {
    paymentStatus: normalizePaymentStatus(payload?.paymentStatus),
    note: firstString(payload?.note) ?? "",
  };
  const path = orderPaymentStatusPath(orderIdentifier);
  const url = resolveApiRequestUrl(path);

  try {
    const result = await apiPatch(path, normalizedPayload, ADMIN_ORDER_REQUEST_OPTIONS);
    const data = getEnvelopeData(result);
    logAdminOrderAction(url, normalizedPayload, result?.status, data);
    return data;
  } catch (error) {
    logAdminOrderAction(
      url,
      normalizedPayload,
      error?.status ?? null,
      error?.details ?? error?.message ?? null,
    );
    throw error;
  }
}

export async function createAdminInvoiceForOrder(orderNumber) {
  const result = await apiPost(
    endpoints.admin.invoices,
    {
      orderNumber,
    },
    ADMIN_ORDER_REQUEST_OPTIONS,
  );
  return getEnvelopeData(result);
}

export async function getAdminCourierOptions() {
  const result = await apiGet(endpoints.admin.couriers, ADMIN_ORDER_REQUEST_OPTIONS);
  const payload = getEnvelopeData(result);
  return normalizeItems(payload).map(normalizeCourierOption);
}

export {
  isShopPickupFulfillmentMethod,
  normalizeFulfillmentMethod,
  resolveBackendMessage,
  resolveOrderState,
  toDisplayLabel,
};
