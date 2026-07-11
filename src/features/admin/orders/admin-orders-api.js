import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
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

function orderActionPath(orderNumber, action) {
  return `${endpoints.admin.orderDetail(orderNumber)}/${action}`;
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

  if (normalized.includes("paid")) {
    return "paid";
  }

  if (normalized.includes("reject")) {
    return "rejected";
  }

  if (normalized.includes("unpaid")) {
    return "unpaid";
  }

  return normalized.replace(/\s+/g, "_");
}

function normalizeShipmentStatus(value) {
  const normalized = (firstString(value) ?? "pending").toLowerCase();

  return normalized.replace(/\s+/g, "_");
}

function normalizeOrderSummary(item, index = 0) {
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
    fulfillmentMethod:
      firstString(
        item?.fulfillmentMethod,
        item?.deliveryMethod,
        item?.shippingMethod,
        item?.shipment?.method,
      ) ?? "—",
    paymentStatus: normalizePaymentStatus(
      item?.paymentStatus ?? item?.payment?.status ?? item?.payment_state,
    ),
    paymentStatusLabel:
      firstString(item?.paymentStatusLabel, item?.payment?.status, item?.paymentStatus) ??
      "Pending",
    orderStatus: normalizeOrderStatus(item?.status ?? item?.orderStatus),
    orderStatusLabel:
      firstString(item?.statusLabel, item?.orderStatusLabel, item?.status, item?.orderStatus) ??
      "Pending",
    shipmentStatus: normalizeShipmentStatus(
      item?.shipmentStatus ?? item?.shipment?.status ?? item?.deliveryStatus,
    ),
    shipmentStatusLabel:
      firstString(
        item?.shipmentStatusLabel,
        item?.shipment?.status,
        item?.shipmentStatus,
      ) ?? "Pending",
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
    query,
    credentials: "include",
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
  const result = await apiGet(endpoints.admin.orderDetail(orderNumber));
  const payload = getEnvelopeData(result);
  const item = payload?.order ?? payload?.data ?? payload;

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
      method: summary.paymentMethod,
      status: summary.paymentStatus,
      statusLabel: summary.paymentStatusLabel,
      subtotalMinor:
        summary.subtotalMinor ??
        normalizeMinorAmount(
          item?.subtotalMinor,
          item?.subTotalMinor,
          item?.subtotal?.amountMinor,
          item?.subtotal?.amount,
        ),
      deliveryMinor: normalizeMinorAmount(
        item?.deliveryFeeMinor,
        item?.deliveryChargeMinor,
        item?.shippingFeeMinor,
      ),
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
        (normalizeOrderStatus(summary.orderStatus) !== "cancelled" &&
          normalizeOrderStatus(summary.orderStatus) !== "delivered"),
      canCreateShipment:
        summary.canCreateShipment ||
        shipments.length === 0 ||
        normalizeOrderStatus(summary.orderStatus) === "processing",
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

export async function updateAdminOrderStatus(orderNumber, payload) {
  const result = await apiPatch(endpoints.admin.orderDetail(orderNumber), payload);
  return getEnvelopeData(result);
}

export async function cancelAdminOrder(orderNumber, payload) {
  try {
    const result = await apiPost(orderActionPath(orderNumber, "cancel"), payload);
    return getEnvelopeData(result);
  } catch (error) {
    const result = await apiPatch(endpoints.admin.orderDetail(orderNumber), {
      ...payload,
      action: "cancel",
    });
    return getEnvelopeData(result);
  }
}

export async function saveAdminOrderNote(orderNumber, note) {
  const result = await apiPatch(endpoints.admin.orderDetail(orderNumber), {
    action: "save_note",
    adminNote: note,
  });
  return getEnvelopeData(result);
}

export async function createAdminShipmentFromOrder(orderNumber, payload) {
  const result = await apiPost(endpoints.admin.shipments, {
    orderNumber,
    ...payload,
  });
  return getEnvelopeData(result);
}

export async function createAdminInvoiceForOrder(orderNumber) {
  const result = await apiPost(endpoints.admin.invoices, {
    orderNumber,
  });
  return getEnvelopeData(result);
}

export async function getAdminCourierOptions() {
  const result = await apiGet(endpoints.admin.couriers);
  const payload = getEnvelopeData(result);
  return normalizeItems(payload).map(normalizeCourierOption);
}
