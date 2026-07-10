"use client";

import {
  apiDownload,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
  apiUpload,
  createObjectUrl,
  revokeObjectUrl,
} from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { normalizeOrderSummary } from "@/features/checkout/checkout-api";

const ACCOUNT_REQUEST_OPTIONS = {
  credentials: "include",
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

function toDisplayLabel(value, fallback = "Pending") {
  const source = firstString(value) ?? fallback;

  return source
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function normalizeOrderStatuses(orderPayload, baseStatus) {
  const rawOrderStatus = firstString(baseStatus, orderPayload?.status, orderPayload?.orderStatus);
  const rawShipmentStatus = firstString(
    orderPayload?.shipmentStatus,
    orderPayload?.shipment?.status,
    orderPayload?.deliveryStatus,
  );
  const rawPaymentStatus = firstString(
    orderPayload?.paymentStatus,
    orderPayload?.payment?.status,
  );
  const shipmentStatusLabel = toDisplayLabel(rawShipmentStatus, "Processing");
  const paymentStatusLabel = toDisplayLabel(rawPaymentStatus, "Pending");
  const normalizedShipmentStatus = rawShipmentStatus?.toLowerCase() ?? "";
  const normalizedOrderStatus = rawOrderStatus?.toLowerCase() ?? "";

  let orderStatusLabel = toDisplayLabel(rawOrderStatus, "Pending");

  if (
    normalizedShipmentStatus.includes("deliver") ||
    normalizedShipmentStatus.includes("complete")
  ) {
    orderStatusLabel = "Delivered";
  } else if (
    normalizedOrderStatus.includes("deliver") ||
    normalizedOrderStatus.includes("complete")
  ) {
    orderStatusLabel = "Delivered";
  } else if (normalizedOrderStatus.includes("cancel")) {
    orderStatusLabel = "Cancelled";
  }

  return {
    orderStatusLabel,
    paymentStatusLabel,
    shipmentStatusLabel,
  };
}

function normalizeOrderItem(item, index = 0) {
  return {
    id: firstString(item?.id, item?._id, item?.productId, `item-${index}`) ?? `item-${index}`,
    productId: firstString(item?.productId, item?.product?._id, item?.product?.id),
    name:
      firstString(item?.name, item?.productName, item?.product?.name, item?.title) ??
      "Used auto part",
    quantity: firstNumber(item?.quantity, item?.qty) ?? 1,
    amountMinor: toMinorAmount(item?.priceMinor, item?.price, item?.totalMinor),
    imageUrl: firstString(item?.imageUrl, item?.product?.imageUrl, item?.product?.primaryImageUrl),
  };
}

function normalizeOrder(payload) {
  const base = normalizeOrderSummary(payload);
  const orderPayload = payload?.item ?? payload?.order ?? payload ?? {};
  const rawItems = Array.isArray(orderPayload?.items) ? orderPayload.items : [];
  const statuses = normalizeOrderStatuses(orderPayload, base.status);

  return {
    ...base,
    status: statuses.orderStatusLabel,
    id: firstString(orderPayload?.id, orderPayload?._id, base.orderNumber) ?? base.orderNumber,
    orderNumber: base.orderNumber ?? firstString(orderPayload?.number, orderPayload?.id),
    paymentStatus: statuses.paymentStatusLabel,
    shipmentStatus: statuses.shipmentStatusLabel,
    items: rawItems.map(normalizeOrderItem),
    invoiceNumber:
      firstString(
        orderPayload?.invoiceNumber,
        orderPayload?.invoice?.invoiceNumber,
        orderPayload?.invoice?.number,
      ) ?? null,
    customerName:
      firstString(
        orderPayload?.customerName,
        orderPayload?.shippingAddress?.fullName,
        orderPayload?.deliveryAddress?.recipientName,
      ) ?? null,
    shippingAddress:
      firstString(
        orderPayload?.shippingAddress?.fullAddress,
        orderPayload?.shippingAddress?.addressLine1,
        orderPayload?.shippingAddress?.address,
        orderPayload?.deliveryAddress?.line1,
      ) ?? null,
    billingAddress:
      firstString(
        orderPayload?.billingAddress?.fullAddress,
        orderPayload?.billingAddress?.addressLine1,
        orderPayload?.billingAddress?.address,
        orderPayload?.deliveryAddress?.line1,
      ) ?? null,
    trackingNumber:
      firstString(orderPayload?.trackingNumber, orderPayload?.shipment?.trackingNumber) ?? null,
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
    ACCOUNT_REQUEST_OPTIONS,
  );
  return normalizeOrder(getEnvelopeData(result));
}

export async function getCustomerPayments() {
  const result = await apiGet(endpoints.account.payments, ACCOUNT_REQUEST_OPTIONS);
  return normalizePaymentCollection(result);
}

export async function submitManualPayment(payload) {
  const formData = new FormData();
  formData.append("orderNumber", payload.orderNumber);

  if (payload.amount) {
    formData.append("amount", payload.amount);
  }

  if (payload.referenceNumber) {
    formData.append("referenceNumber", payload.referenceNumber);
  }

  if (payload.transferDate) {
    formData.append("transferDate", payload.transferDate);
  }

  if (payload.notes) {
    formData.append("notes", payload.notes);
  }

  if (payload.receipt) {
    formData.append("receipt", payload.receipt);
  }

  return apiUpload(endpoints.customer.manualPaymentSubmission, formData);
}

export async function getCustomerInvoices() {
  const result = await apiGet(endpoints.account.invoices, ACCOUNT_REQUEST_OPTIONS);
  return getCollectionItems(result).map(normalizeInvoice);
}

export async function downloadCustomerInvoicePdf(invoiceNumber) {
  const result = await apiDownload(endpoints.customer.invoicePdf(invoiceNumber));
  return {
    fileName: result?.fileName ?? `${invoiceNumber}.pdf`,
    objectUrl: createObjectUrl(result.blob),
    dispose: (objectUrl) => revokeObjectUrl(objectUrl),
  };
}

export async function getCustomerNotifications() {
  const result = await apiGet(endpoints.account.notifications, ACCOUNT_REQUEST_OPTIONS);
  return getCollectionItems(result).map(normalizeNotification);
}

export async function getCustomerEnquiries() {
  const result = await apiGet(endpoints.account.enquiries, ACCOUNT_REQUEST_OPTIONS);
  return getCollectionItems(result).map(normalizeEnquiry);
}

export async function createCustomerEnquiry(payload) {
  const result = await apiPost(endpoints.customer.enquiries, payload);
  return normalizeEnquiry(getEnvelopeData(result));
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

export async function createCustomerReturn(payload) {
  const result = await apiPost(endpoints.customer.returns, payload);
  return normalizeReturn(getEnvelopeData(result));
}

export async function getCustomerProfile() {
  const result = await apiGet(endpoints.account.profile, ACCOUNT_REQUEST_OPTIONS);
  return normalizeProfile(getEnvelopeData(result));
}

export async function updateCustomerProfile(payload) {
  try {
    const result = await apiPatch(endpoints.account.profile, payload, ACCOUNT_REQUEST_OPTIONS);
    return normalizeProfile(getEnvelopeData(result));
  } catch (error) {
    if (error?.status !== 405) {
      throw error;
    }

    const result = await apiPut(endpoints.account.profile, payload, ACCOUNT_REQUEST_OPTIONS);
    return normalizeProfile(getEnvelopeData(result));
  }
}
