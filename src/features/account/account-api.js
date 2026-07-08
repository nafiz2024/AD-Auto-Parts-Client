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

  return {
    ...base,
    id: firstString(orderPayload?.id, orderPayload?._id, base.orderNumber) ?? base.orderNumber,
    orderNumber: base.orderNumber ?? firstString(orderPayload?.number, orderPayload?.id),
    paymentStatus:
      firstString(orderPayload?.paymentStatus, orderPayload?.payment?.status) ?? "Pending",
    shipmentStatus:
      firstString(
        orderPayload?.shipmentStatus,
        orderPayload?.shipment?.status,
        orderPayload?.deliveryStatus,
      ) ?? "Processing",
    items: rawItems.map(normalizeOrderItem),
    invoiceNumber:
      firstString(
        orderPayload?.invoiceNumber,
        orderPayload?.invoice?.invoiceNumber,
        orderPayload?.invoice?.number,
      ) ?? null,
    customerName:
      firstString(orderPayload?.customerName, orderPayload?.shippingAddress?.fullName) ?? null,
    shippingAddress:
      firstString(
        orderPayload?.shippingAddress?.fullAddress,
        orderPayload?.shippingAddress?.addressLine1,
        orderPayload?.shippingAddress?.address,
      ) ?? null,
    billingAddress:
      firstString(
        orderPayload?.billingAddress?.fullAddress,
        orderPayload?.billingAddress?.addressLine1,
        orderPayload?.billingAddress?.address,
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
        : [],
  };
}

function normalizePaymentRecord(order, index = 0) {
  return {
    id: firstString(order?.id, order?.orderNumber, `payment-${index}`) ?? `payment-${index}`,
    orderNumber: firstString(order?.orderNumber, order?.number),
    paymentMethod: firstString(order?.paymentMethod, order?.payment?.method) ?? "COD",
    paymentStatus: firstString(order?.paymentStatus, order?.payment?.status) ?? "Pending",
    amountMinor: toMinorAmount(order?.totalMinor, order?.total, order?.payment?.amount),
    createdAt: firstString(order?.createdAt, order?.placedAt),
    needsManualProof:
      firstString(order?.paymentMethod, order?.payment?.method) === "MANUAL_ADVANCE",
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

export async function getCustomerOrders() {
  const result = await apiGet(endpoints.customer.orders);
  return normalizeItems(getEnvelopeData(result)).map((item) => normalizeOrder(item));
}

export async function getCustomerOrderDetail(orderNumber) {
  const result = await apiGet(endpoints.customer.orderDetail(orderNumber));
  return normalizeOrder(getEnvelopeData(result));
}

export async function getCustomerPayments() {
  const orders = await getCustomerOrders();
  return orders.map(normalizePaymentRecord);
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
  const result = await apiGet(endpoints.customer.invoices);
  return normalizeItems(getEnvelopeData(result)).map(normalizeInvoice);
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
  const result = await apiGet(endpoints.customer.notifications);
  return normalizeItems(getEnvelopeData(result)).map(normalizeNotification);
}

export async function getCustomerEnquiries() {
  const result = await apiGet(endpoints.customer.enquiries);
  return normalizeItems(getEnvelopeData(result)).map(normalizeEnquiry);
}

export async function createCustomerEnquiry(payload) {
  const result = await apiPost(endpoints.customer.enquiries, payload);
  return normalizeEnquiry(getEnvelopeData(result));
}

export async function getCustomerReviews() {
  const result = await apiGet(endpoints.customer.reviews);
  return normalizeItems(getEnvelopeData(result)).map(normalizeReview);
}

export async function getCustomerQuestions() {
  const result = await apiGet(endpoints.customer.productQuestions);
  return normalizeItems(getEnvelopeData(result)).map(normalizeQuestion);
}

export async function getCustomerReturns() {
  const result = await apiGet(endpoints.customer.returns);
  return normalizeItems(getEnvelopeData(result)).map(normalizeReturn);
}

export async function createCustomerReturn(payload) {
  const result = await apiPost(endpoints.customer.returns, payload);
  return normalizeReturn(getEnvelopeData(result));
}

export async function getCustomerProfile() {
  const result = await apiGet(endpoints.customer.profile);
  return normalizeProfile(getEnvelopeData(result));
}

export async function updateCustomerProfile(payload) {
  try {
    const result = await apiPatch(endpoints.customer.profile, payload);
    return normalizeProfile(getEnvelopeData(result));
  } catch (error) {
    if (error?.status !== 405) {
      throw error;
    }

    const result = await apiPut(endpoints.customer.profile, payload);
    return normalizeProfile(getEnvelopeData(result));
  }
}
