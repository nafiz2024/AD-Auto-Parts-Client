"use client";

import {
  apiGet,
  apiPatch,
} from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { normalizeOrderSummary } from "@/features/checkout/checkout-api";

const ACCOUNT_REQUEST_OPTIONS = {
  credentials: "include",
};

const ORDER_DETAIL_REQUEST_OPTIONS = {
  ...ACCOUNT_REQUEST_OPTIONS,
  cache: "no-store",
};

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
    const number = Number(value);

    if (Number.isFinite(number)) {
      return number;
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

function getCollectionItems(payload) {
  const data = getEnvelopeData(payload);
  return normalizeItems(data);
}

function toMinorAmount(...values) {
  for (const value of values) {
    const directNumber = firstNumber(value);

    if (directNumber !== null) {
      return directNumber;
    }

    if (value && typeof value === "object") {
      const nestedNumber = firstNumber(value.amount, value.value, value.minor);

      if (nestedNumber !== null) {
        return nestedNumber;
      }
    }
  }

  return null;
}

function normalizeMinorAmount(...values) {
  const amount = toMinorAmount(...values);
  return amount === null ? null : Math.round(amount);
}

function normalizeMajorAmountToMinor(...values) {
  const amount = firstNumber(...values);
  return amount === null ? null : Math.round(amount * 100);
}

function normalizeAddress(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value.trim() || null;
  }

  const lines = [
    firstString(
      value.fullAddress,
      value.address,
      value.addressLine1,
      value.line1,
      value.street,
    ),
    firstString(value.addressLine2, value.line2, value.neighborhood, value.area),
    firstString(value.city),
    firstString(value.region, value.state, value.province),
    firstString(value.postalCode, value.zipCode),
    firstString(value.country),
  ].filter(Boolean);

  return lines.length > 0 ? lines.join(", ") : null;
}

function toDisplayLabel(value, fallback = "Pending") {
  const source = firstString(value) ?? fallback;

  return source
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function normalizeStatusValue(value) {
  const normalized = firstString(value)?.toLowerCase();

  if (!normalized) {
    return "";
  }

  if (normalized.includes("cancel")) {
    return "cancelled";
  }

  if (normalized.includes("pick")) {
    return "picked_up";
  }

  return normalized.replace(/\s+/g, "_");
}

function normalizeFulfillmentMethod(...values) {
  return (firstString(...values) ?? "").toLowerCase().replace(/\s+/g, "_");
}

function isShopPickupMethod(value) {
  return normalizeFulfillmentMethod(value) === "shop_pickup" || normalizeFulfillmentMethod(value) === "shop_receive";
}

function mapLifecycleStatus(value, fallback = "Pending") {
  const normalizedValue = firstString(value)?.toLowerCase();

  if (!normalizedValue) {
    return fallback;
  }

  if (normalizedValue.includes("deliver") || normalizedValue.includes("complete")) {
    return "Delivered";
  }

  if (normalizedValue.includes("ship")) {
    return "Shipped";
  }

  if (normalizedValue.includes("confirm") || normalizedValue.includes("process")) {
    return "Processing";
  }

  if (normalizedValue.includes("unassigned")) {
    return "Unassigned";
  }

  if (normalizedValue.includes("pending")) {
    return "Pending";
  }

  return toDisplayLabel(normalizedValue, fallback);
}

function normalizeOrderStatuses(orderPayload, baseStatus) {
  const fulfillmentMethod = normalizeFulfillmentMethod(
    orderPayload?.fulfillmentMethod,
    orderPayload?.deliveryMethod,
    orderPayload?.shipment?.fulfillmentMethod,
  );
  const rawOrderStatus = firstString(baseStatus, orderPayload?.status, orderPayload?.orderStatus);
  const rawShipmentStatus = firstString(
    orderPayload?.shipmentStatus,
    orderPayload?.shipment?.status,
    orderPayload?.deliveryStatus,
  );
  const rawDeliveryStatus = firstString(orderPayload?.deliveryStatus, orderPayload?.delivery?.status);
  const rawPickupStatus = firstString(orderPayload?.pickupStatus, orderPayload?.pickup?.status);
  const rawPaymentStatus = firstString(
    orderPayload?.paymentStatus,
    orderPayload?.payment?.status,
  );
  const normalizedOrderStatus = normalizeStatusValue(rawOrderStatus);
  const normalizedShipmentStatus = normalizeStatusValue(rawShipmentStatus);
  const normalizedDeliveryStatus = normalizeStatusValue(rawDeliveryStatus);
  const normalizedPickupStatus = normalizeStatusValue(rawPickupStatus);
  const paymentStatusLabel = toDisplayLabel(rawPaymentStatus, "Pending");
  let orderStatusLabel =
    normalizedOrderStatus === "picked_up"
      ? "Picked Up"
      : mapLifecycleStatus(rawOrderStatus, "Pending");
  let shipmentStatusLabel = mapLifecycleStatus(rawShipmentStatus, "Pending");

  if (isShopPickupMethod(fulfillmentMethod)) {
    shipmentStatusLabel =
      normalizedPickupStatus === "picked_up" ||
      normalizedOrderStatus === "picked_up" ||
      normalizedOrderStatus === "delivered"
        ? "Picked Up"
        : "Shop Pickup";

    if (normalizedOrderStatus === "delivered") {
      orderStatusLabel = "Picked Up";
    }
  } else if (
    normalizedOrderStatus === "delivered" ||
    normalizedShipmentStatus === "delivered" ||
    normalizedDeliveryStatus === "delivered"
  ) {
    orderStatusLabel = "Delivered";
    shipmentStatusLabel = "Delivered";
  } else if (normalizedOrderStatus === "cancelled") {
    orderStatusLabel = "Cancelled";
  }

  return {
    orderStatusLabel,
    paymentStatusLabel,
    shipmentStatusLabel,
  };
}

function normalizeOrderItem(item, index = 0) {
  const quantity = firstNumber(item?.quantity, item?.qty) ?? 1;
  const unitPriceMinor = normalizeMinorAmount(
    item?.unitPriceMinor,
    item?.priceMinor,
    item?.unitPrice?.amountMinor,
    item?.price?.amountMinor,
    item?.unitPrice,
    item?.price,
  );
  const lineTotalMinor = normalizeMinorAmount(
    item?.subtotalMinor,
    item?.lineTotalMinor,
    item?.totalMinor,
    item?.subtotal?.amountMinor,
    item?.lineTotal?.amountMinor,
    item?.total?.amountMinor,
    item?.subtotal,
    item?.lineTotal,
    item?.total,
  );

  return {
    id: firstString(item?.id, item?._id, item?.productId, `item-${index}`) ?? `item-${index}`,
    productId: firstString(item?.productId, item?.product?._id, item?.product?.id),
    name:
      firstString(item?.name, item?.productName, item?.product?.name, item?.title) ??
      "Used auto part",
    quantity,
    unitPriceMinor,
    amountMinor:
      lineTotalMinor ??
      (unitPriceMinor !== null ? unitPriceMinor * quantity : null),
    imageUrl: firstString(item?.imageUrl, item?.product?.imageUrl, item?.product?.primaryImageUrl),
  };
}

function normalizeOrder(payload) {
  const base = normalizeOrderSummary(payload);
  const orderPayload = payload?.item ?? payload?.order ?? payload ?? {};
  const rawItems = Array.isArray(orderPayload?.items) ? orderPayload.items : [];
  const statuses = normalizeOrderStatuses(orderPayload, base.status);
  const deliveryFeeMinor = normalizeMinorAmount(
    orderPayload?.deliveryFeeMinor,
    orderPayload?.deliveryChargeMinor,
    orderPayload?.shippingFeeMinor,
    orderPayload?.delivery?.amountMinor,
    orderPayload?.shipping?.amountMinor,
  ) ?? normalizeMajorAmountToMinor(
    orderPayload?.deliveryFee,
    orderPayload?.deliveryCharge,
    orderPayload?.shippingFee,
    orderPayload?.delivery?.amount,
    orderPayload?.shipping?.amount,
  );
  const itemTotalMinor = normalizeMinorAmount(
    orderPayload?.subtotalMinor,
    orderPayload?.subTotalMinor,
    orderPayload?.subtotal?.amountMinor,
    orderPayload?.subtotal?.amount,
  );
  const normalizedItems = rawItems.map(normalizeOrderItem);
  const derivedItemTotalMinor = normalizedItems.reduce(
    (sum, item) => sum + (item.amountMinor ?? 0),
    0,
  );
  const fulfillmentMethod = firstString(
    orderPayload?.fulfillmentMethod,
    orderPayload?.deliveryMethod,
    orderPayload?.shipment?.fulfillmentMethod,
  );
  const invoicePdfPath = firstString(
    orderPayload?.invoice?.pdfPath,
    orderPayload?.invoice?.pdfUrl,
    orderPayload?.invoice?.downloadPath,
    orderPayload?.invoice?.downloadUrl,
  );

  return {
    ...base,
    status: statuses.orderStatusLabel,
    id: firstString(orderPayload?.id, orderPayload?._id, base.orderNumber) ?? base.orderNumber,
    orderNumber: base.orderNumber ?? firstString(orderPayload?.number, orderPayload?.id),
    paymentStatus: statuses.paymentStatusLabel,
    shipmentStatus: statuses.shipmentStatusLabel,
    fulfillmentMethod: fulfillmentMethod ? toDisplayLabel(fulfillmentMethod) : null,
    itemTotalMinor:
      itemTotalMinor ?? (normalizedItems.length > 0 ? derivedItemTotalMinor : null),
    deliveryFeeMinor,
    items: normalizedItems,
    invoiceNumber:
      firstString(
        orderPayload?.invoiceNumber,
        orderPayload?.invoice?.invoiceNumber,
        orderPayload?.invoice?.number,
        orderPayload?.invoice?.referenceNumber,
      ) ?? null,
    invoice: {
      invoiceNumber:
        firstString(
          orderPayload?.invoiceNumber,
          orderPayload?.invoice?.invoiceNumber,
          orderPayload?.invoice?.number,
          orderPayload?.invoice?.referenceNumber,
        ) ?? null,
      pdfPath: invoicePdfPath || null,
    },
    customerName:
      firstString(
        orderPayload?.customerName,
        orderPayload?.shippingAddress?.fullName,
        orderPayload?.deliveryAddress?.recipientName,
      ) ?? null,
    shippingAddress:
      normalizeAddress(orderPayload?.shippingAddress) ??
      normalizeAddress(orderPayload?.deliveryAddress) ??
      null,
    billingAddress:
      normalizeAddress(orderPayload?.billingAddress) ??
      normalizeAddress(orderPayload?.shippingAddress) ??
      normalizeAddress(orderPayload?.deliveryAddress) ??
      null,
    trackingNumber:
      firstString(
        orderPayload?.trackingNumber,
        orderPayload?.trackingCode,
        orderPayload?.shipment?.trackingNumber,
        orderPayload?.shipment?.trackingCode,
        orderPayload?.shipments?.[0]?.trackingNumber,
        orderPayload?.shipments?.[0]?.trackingCode,
      ) ?? null,
    courierName:
      firstString(orderPayload?.courierName, orderPayload?.shipment?.courierName) ?? null,
    notes: firstString(orderPayload?.notes, orderPayload?.customerNote),
    statusTimeline: Array.isArray(orderPayload?.statusTimeline)
      ? orderPayload.statusTimeline
      : Array.isArray(orderPayload?.timeline)
        ? orderPayload.timeline
        : Array.isArray(orderPayload?.trackingHistory)
          ? orderPayload.trackingHistory
        : [],
  };
}

function normalizePaymentRecord(order, index = 0) {
  const paymentMethod =
    firstString(order?.paymentMethod, order?.payment?.method) ?? "cash_on_delivery";

  return {
    id: firstString(order?.id, order?.orderNumber, `payment-${index}`) ?? `payment-${index}`,
    orderNumber: firstString(order?.orderNumber, order?.number),
    paymentMethod,
    paymentStatus: firstString(order?.paymentStatus, order?.payment?.status) ?? "Pending",
    amountMinor: toMinorAmount(order?.totalMinor, order?.total, order?.payment?.amount),
    createdAt: firstString(order?.createdAt, order?.placedAt),
    needsManualProof: paymentMethod.toLowerCase() === "manual_advance_payment",
  };
}

function normalizeInvoice(item, index = 0) {
  return {
    id: firstString(item?.id, item?._id, item?.invoiceNumber, `invoice-${index}`) ?? `invoice-${index}`,
    invoiceNumber:
      firstString(item?.invoiceNumber, item?.number, item?.id) ?? `INV-${index + 1}`,
    orderNumber: firstString(item?.orderNumber, item?.order?.orderNumber),
    status: firstString(item?.status, item?.paymentStatus) ?? "Pending",
    totalMinor: toMinorAmount(item?.totalMinor, item?.total, item?.amount),
    issuedAt: firstString(item?.issuedAt, item?.createdAt, item?.date),
    dueAt: firstString(item?.dueAt, item?.dueDate),
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

function normalizeEnquiry(item, index = 0) {
  return {
    id: firstString(item?.id, item?._id, `enquiry-${index}`) ?? `enquiry-${index}`,
    subject: firstString(item?.subject, item?.title) ?? "Support enquiry",
    message: firstString(item?.message, item?.body) ?? "",
    status: firstString(item?.status) ?? "Submitted",
    enquiryType: firstString(item?.enquiryType, item?.type) ?? "general",
    createdAt: firstString(item?.createdAt, item?.submittedAt),
  };
}

function normalizeReview(item, index = 0) {
  return {
    id: firstString(item?.id, item?._id, `review-${index}`) ?? `review-${index}`,
    productName: firstString(item?.productName, item?.product?.name) ?? "Used auto part",
    rating: firstNumber(item?.rating) ?? null,
    status: firstString(item?.status) ?? "Pending",
    title: firstString(item?.title, item?.headline),
    comment: firstString(item?.comment, item?.message),
    createdAt: firstString(item?.createdAt, item?.submittedAt),
  };
}

function normalizeQuestion(item, index = 0) {
  return {
    id: firstString(item?.id, item?._id, `question-${index}`) ?? `question-${index}`,
    productName: firstString(item?.productName, item?.product?.name) ?? "Used auto part",
    question: firstString(item?.question, item?.message, item?.body) ?? "",
    answer: firstString(item?.answer, item?.reply),
    status: firstString(item?.status) ?? "Open",
    createdAt: firstString(item?.createdAt, item?.submittedAt),
  };
}

function normalizeReturn(item, index = 0) {
  return {
    id: firstString(item?.id, item?._id, `return-${index}`) ?? `return-${index}`,
    orderNumber: firstString(item?.orderNumber, item?.order?.orderNumber),
    reason: firstString(item?.reason, item?.title) ?? "Return review",
    status: firstString(item?.status) ?? "Pending Review",
    message: firstString(item?.message, item?.details, item?.body),
    createdAt: firstString(item?.createdAt, item?.submittedAt),
  };
}

function normalizeProfile(payload) {
  const item = payload?.item ?? payload?.profile ?? payload?.customer ?? payload?.user ?? payload ?? {};

  return {
    id: firstString(item?.id, item?._id),
    fullName:
      firstString(item?.fullName, item?.name, item?.customerName, item?.user?.name) ?? "",
    email: firstString(item?.email, item?.user?.email) ?? "",
    phone: firstString(item?.phone, item?.mobile, item?.phoneNumber) ?? "",
    city: firstString(item?.city, item?.address?.city) ?? "",
    region: firstString(item?.region, item?.state, item?.address?.region) ?? "",
    address:
      firstString(item?.address, item?.addressLine1, item?.address?.addressLine1) ?? "",
    notes: firstString(item?.notes, item?.customerNote) ?? "",
  };
}

function normalizeAccountSummary(payload) {
  const data = getEnvelopeData(payload);
  const counts = data?.counts ?? data?.summary ?? data?.stats ?? {};
  const recentOrders = normalizeItems(
    data?.recentOrders ?? data?.orders ?? data?.latestOrders ?? [],
  ).map((item) => normalizeOrder(item));
  const recentNotifications = normalizeItems(
    data?.recentNotifications ?? data?.notifications ?? data?.latestNotifications ?? [],
  ).map((item) => normalizeNotification(item));

  return {
    orderCount:
      firstNumber(
        counts?.orders,
        counts?.orderCount,
        counts?.totalOrders,
        data?.orderCount,
        recentOrders.length,
      ) ?? 0,
    paymentCount:
      firstNumber(
        counts?.payments,
        counts?.paymentCount,
        counts?.totalPayments,
        data?.paymentCount,
      ) ?? 0,
    invoiceCount:
      firstNumber(
        counts?.invoices,
        counts?.invoiceCount,
        counts?.totalInvoices,
        data?.invoiceCount,
      ) ?? 0,
    notificationCount:
      firstNumber(
        counts?.notifications,
        counts?.notificationCount,
        counts?.totalNotifications,
        data?.notificationCount,
        recentNotifications.length,
      ) ?? 0,
    recentOrders,
    recentNotifications,
  };
}

function normalizePaymentCollection(payload) {
  const data = getEnvelopeData(payload);
  const payments = normalizeItems(
    data?.payments ?? data?.items ?? data?.results ?? data,
  ).map((item, index) => normalizePaymentRecord(item, index));
  const manualPaymentOrders = normalizeItems(
    data?.manualPaymentOrders ??
      data?.eligibleOrders ??
      data?.manualAdvanceOrders ??
      data?.orders ??
      [],
  ).map((item) => normalizeOrder(item));

  return {
    payments,
    manualPaymentOrders:
      manualPaymentOrders.length > 0
        ? manualPaymentOrders
        : payments
            .filter((payment) => payment.needsManualProof)
            .map((payment) => ({
              orderNumber: payment.orderNumber,
              paymentMethod: payment.paymentMethod,
              paymentStatus: payment.paymentStatus,
              totalMinor: payment.amountMinor,
              createdAt: payment.createdAt,
            })),
  };
}

export async function getCustomerAccountSummary() {
  const result = await apiGet(endpoints.account.summary, ACCOUNT_REQUEST_OPTIONS);
  return normalizeAccountSummary(result);
}

export async function getCustomerOrders() {
  const result = await apiGet(endpoints.account.orders, ACCOUNT_REQUEST_OPTIONS);
  return getCollectionItems(result).map((item) => normalizeOrder(item));
}

export async function getCustomerOrderDetail(orderNumber) {
  const result = await apiGet(
    endpoints.account.orderDetail(orderNumber),
    ORDER_DETAIL_REQUEST_OPTIONS,
  );
  return normalizeOrder(getEnvelopeData(result));
}

export async function getCustomerPayments() {
  const result = await apiGet(endpoints.account.payments, ACCOUNT_REQUEST_OPTIONS);
  return normalizePaymentCollection(result);
}

export async function getCustomerInvoices() {
  const result = await apiGet(endpoints.account.invoices, ACCOUNT_REQUEST_OPTIONS);
  return getCollectionItems(result).map(normalizeInvoice);
}

export async function getCustomerNotifications() {
  const result = await apiGet(endpoints.account.notifications, ACCOUNT_REQUEST_OPTIONS);
  return getCollectionItems(result).map(normalizeNotification);
}

export async function getCustomerEnquiries() {
  const result = await apiGet(endpoints.account.enquiries, ACCOUNT_REQUEST_OPTIONS);
  return getCollectionItems(result).map(normalizeEnquiry);
}

export async function getCustomerReviews() {
  const result = await apiGet(endpoints.account.reviews, ACCOUNT_REQUEST_OPTIONS);
  return getCollectionItems(result).map(normalizeReview);
}

export async function getCustomerQuestions() {
  const result = await apiGet(endpoints.account.questions, ACCOUNT_REQUEST_OPTIONS);
  return getCollectionItems(result).map(normalizeQuestion);
}

export async function getCustomerReturns() {
  const result = await apiGet(endpoints.account.returns, ACCOUNT_REQUEST_OPTIONS);
  return getCollectionItems(result).map(normalizeReturn);
}

export async function getCustomerProfile() {
  const result = await apiGet(endpoints.account.profile, ACCOUNT_REQUEST_OPTIONS);
  return normalizeProfile(getEnvelopeData(result));
}

export async function updateCustomerProfile(payload) {
  const result = await apiPatch(
    endpoints.account.profile,
    {
      name: payload.fullName || payload.name || undefined,
      phone: payload.phone || undefined,
    },
    ACCOUNT_REQUEST_OPTIONS,
  );
  return normalizeProfile(getEnvelopeData(result));
}
