"use client";

import {
  apiDownload,
  apiGet,
  apiPost,
  apiRequest,
  createObjectUrl,
  resolveApiRequestUrl,
  revokeObjectUrl,
} from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { API_BASE_URL } from "@/config/env";
import { createApiError } from "@/lib/api/errors";

const ACCOUNT_REQUEST_OPTIONS = {
  credentials: "include",
};

const ACCOUNT_NO_STORE_REQUEST_OPTIONS = {
  ...ACCOUNT_REQUEST_OPTIONS,
  cache: "no-store",
};

const ADMIN_NO_STORE_REQUEST_OPTIONS = {
  cache: "no-store",
};
const IS_DEVELOPMENT = process.env.NODE_ENV !== "production";

function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    return [value];
  }

  return [];
}

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
    const numericValue = Number(value);

    if (Number.isFinite(numericValue)) {
      return Math.round(numericValue);
    }
  }

  return null;
}

function firstBoolean(...values) {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value > 0;
    }
  }

  return null;
}

function sanitizeMessage(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed && trimmed !== "[object Object]" ? trimmed : null;
}

function findReadableMessage(value) {
  const directMessage = sanitizeMessage(value);

  if (directMessage) {
    return directMessage;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const nestedMessage = findReadableMessage(entry);

      if (nestedMessage) {
        return nestedMessage;
      }
    }

    return null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  for (const nestedValue of Object.values(value)) {
    const nestedMessage = findReadableMessage(nestedValue);

    if (nestedMessage) {
      return nestedMessage;
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

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

function getEnvelopeData(result) {
  return result?.data ?? result?.raw ?? result ?? {};
}

function normalizeMinorAmount(...values) {
  return firstNumber(...values);
}

function toDisplayLabel(value) {
  const normalized = sanitizeMessage(value);

  if (!normalized) {
    return null;
  }

  return normalized
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function normalizeStatusToken(value) {
  const normalized = sanitizeMessage(value)?.toLowerCase();

  if (!normalized) {
    return null;
  }

  if (normalized.includes("cancel")) {
    return "cancelled";
  }

  if (normalized.includes("void")) {
    return "void";
  }

  if (normalized.includes("unpaid")) {
    return "unpaid";
  }

  if (normalized.includes("paid")) {
    return "paid";
  }

  if (normalized.includes("issue")) {
    return "issued";
  }

  if (
    normalized.includes("deliver") ||
    normalized.includes("complete") ||
    normalized.includes("picked_up") ||
    normalized.includes("picked up") ||
    normalized.includes("pickup")
  ) {
    return "delivered";
  }

  if (normalized.includes("pend")) {
    return "pending";
  }

  return normalized.replace(/\s+/g, "_");
}

function normalizeInvoiceStatus(...values) {
  for (const value of values) {
    const normalized = normalizeStatusToken(value);

    if (
      normalized &&
      ["issued", "pending", "delivered", "completed", "cancelled", "void"].includes(normalized)
    ) {
      return normalized;
    }
  }

  return null;
}

function normalizePaymentStatus(...values) {
  for (const value of values) {
    const normalized = normalizeStatusToken(value);

    if (normalized && ["paid", "pending", "unpaid"].includes(normalized)) {
      return normalized;
    }
  }

  return null;
}

function getInvoiceStatusLabel(status) {
  switch (status) {
    case "issued":
      return "Issued";
    case "pending":
      return "Pending";
    case "delivered":
    case "completed":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    case "void":
      return "Void";
    default:
      return toDisplayLabel(status);
  }
}

function normalizeFulfillmentMethod(...values) {
  return normalizeStatusToken(firstString(...values)) ?? "";
}

function isShopPickupMethod(...values) {
  const normalized = normalizeFulfillmentMethod(...values);
  return normalized === "shop_pickup" || normalized === "shop_receive";
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
    firstString(value.addressLine2, value.line2, value.district, value.area),
    firstString(value.city),
    firstString(value.region, value.state, value.province),
    firstString(value.postalCode, value.zipCode),
    firstString(value.country),
  ].filter(Boolean);

  return lines.length > 0 ? lines.join(", ") : null;
}

function resolveSafeApiPath(value) {
  const normalized = firstString(value);

  if (!normalized) {
    return null;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized.startsWith(API_BASE_URL) ? normalized : null;
  }

  if (
    normalized.startsWith("/api/") ||
    normalized.startsWith("/account/") ||
    normalized.startsWith("/customer/") ||
    normalized.startsWith("/admin/")
  ) {
    return normalized;
  }

  return null;
}

function normalizeAction(action) {
  if (!action) {
    return null;
  }

  if (typeof action === "string") {
    const path = resolveSafeApiPath(action);
    return path ? { path, method: "POST" } : null;
  }

  if (typeof action !== "object") {
    return null;
  }

  const path = resolveSafeApiPath(
    firstString(action.path, action.href, action.url, action.endpoint),
  );

  if (!path) {
    return null;
  }

  const enabled =
    firstBoolean(action.enabled, action.allowed, action.available) ?? true;

  if (!enabled) {
    return null;
  }

  return {
    path,
    method: firstString(action.method, action.httpMethod)?.toUpperCase() ?? "POST",
  };
}

function normalizeInvoiceItem(item, index = 0) {
  return {
    id:
      firstString(item?.id, item?._id, item?.sku, item?.partNumber, `line-${index}`) ??
      `line-${index}`,
    productName:
      firstString(
        item?.productName,
        item?.name,
        item?.title,
        item?.product?.name,
        item?.description,
        item?.itemName,
      ) ?? "Used auto part",
    description:
      sanitizeMessage(
        firstString(
          item?.description,
          item?.summary,
          item?.product?.description,
          item?.details,
        ),
      ) ?? "",
    sku: firstString(item?.sku, item?.partNumber, item?.product?.sku),
    quantity: firstNumber(item?.quantity, item?.qty, item?.count),
    unitPriceMinor: normalizeMinorAmount(
      item?.unitPriceMinor,
      item?.priceMinor,
      item?.price?.amountMinor,
      item?.unitPrice?.amountMinor,
      item?.price,
      item?.unitPrice,
    ),
    totalMinor: normalizeMinorAmount(
      item?.totalMinor,
      item?.lineTotalMinor,
      item?.total?.amountMinor,
      item?.lineTotal?.amountMinor,
      item?.total,
      item?.lineTotal,
    ),
  };
}

function normalizeInvoiceRecord(item, index = 0, scope = "customer") {
  const invoice = item?.invoice ?? item ?? {};
  const payment = invoice?.payment ?? item?.payment ?? {};
  const customer = invoice?.customer ?? item?.customer ?? {};
  const order = invoice?.order ?? item?.order ?? {};
  const orderCustomer = order?.customer ?? {};
  const orderDelivery = order?.delivery ?? {};
  const shipment = invoice?.shipment ?? order?.shipment ?? {};
  const deliveryAddress =
    normalizeAddress(invoice?.deliveryAddress) ??
    normalizeAddress(invoice?.shippingAddress) ??
    normalizeAddress(invoice?.address) ??
    normalizeAddress(order?.deliveryAddress) ??
    normalizeAddress(order?.shippingAddress) ??
    normalizeAddress(orderDelivery?.address) ??
    normalizeAddress(shipment?.address);
  const isShopPickup = isShopPickupMethod(
    invoice?.fulfillmentMethod,
    invoice?.deliveryMethod,
    order?.fulfillmentMethod,
    order?.deliveryMethod,
    shipment?.fulfillmentMethod,
    shipment?.deliveryMethod,
    item?.fulfillmentMethod,
  );
  const backendInvoiceNumber = firstString(
    invoice?.invoiceNumber,
    invoice?.number,
    item?.invoiceNumber,
    item?.number,
  );
  const orderStatus = normalizeStatusToken(
    firstString(
      order?.orderStatus,
      order?.status,
      invoice?.orderStatus,
      item?.orderStatus,
      shipment?.status,
      shipment?.shipmentStatus,
    ),
  );
  const invoiceStatus =
    normalizeInvoiceStatus(
      invoice?.invoiceStatus,
      invoice?.status,
      item?.invoiceStatus,
      item?.status,
      invoice?.state,
      item?.state,
    ) ??
    (["delivered", "completed", "picked_up"].includes(orderStatus) ? "delivered" : "issued");
  const paymentStatus = normalizePaymentStatus(
    invoice?.paymentStatus,
    payment?.status,
    payment?.paymentStatus,
    item?.paymentStatus,
    item?.payment?.status,
    order?.paymentStatus,
    order?.payment?.status,
  );
  const pdfPath = resolveSafeApiPath(
    firstString(
      invoice?.pdfPath,
      invoice?.pdfUrl,
      invoice?.downloadPath,
      invoice?.downloadUrl,
      item?.pdfPath,
      item?.pdfUrl,
      item?.downloadPath,
      item?.downloadUrl,
      invoice?.links?.pdf,
      item?.links?.pdf,
    ),
  );
  const items = asArray(
    invoice?.lineItems ??
      invoice?.items ??
      invoice?.lines ??
      invoice?.products ??
      item?.lineItems ??
      item?.items ??
      item?.lines ??
      order?.items ??
      order?.lineItems ??
      order?.lines,
  ).map(normalizeInvoiceItem);
  const customerName =
    firstString(
      customer?.name,
      customer?.fullName,
      customer?.customerName,
      orderCustomer?.name,
      orderCustomer?.fullName,
      item?.customerName,
      order?.customerName,
      order?.shippingAddress?.fullName,
      order?.deliveryAddress?.recipientName,
    ) ?? "Customer";
  const customerPhone = firstString(
    customer?.phone,
    customer?.mobile,
    orderCustomer?.phone,
    orderCustomer?.mobile,
    item?.customerPhone,
    order?.customerPhone,
    order?.shippingAddress?.phone,
    order?.deliveryAddress?.phone,
  );
  const customerEmail = firstString(
    customer?.email,
    orderCustomer?.email,
    item?.customerEmail,
    order?.customerEmail,
    order?.shippingAddress?.email,
    order?.deliveryAddress?.email,
  );
  const paymentMethodLabel = toDisplayLabel(
    firstString(invoice?.paymentMethod, payment?.method, item?.paymentMethod),
  );
  const termsNote = sanitizeMessage(
    firstString(
      invoice?.termsNote,
      invoice?.warrantyNote,
      invoice?.termsAndConditions,
      item?.termsNote,
      item?.warrantyNote,
    ),
  );

  return {
    id:
      firstString(invoice?.id, invoice?._id, invoice?.invoiceNumber, item?.id, `invoice-${index}`) ??
      `invoice-${index}`,
    invoiceNumber:
      backendInvoiceNumber ?? `INV-${index + 1}`,
    orderNumber:
      firstString(invoice?.orderNumber, order?.orderNumber, item?.orderNumber, order?.number),
    invoiceStatus,
    invoiceStatusLabel: getInvoiceStatusLabel(invoiceStatus),
    paymentStatus,
    paymentStatusLabel: toDisplayLabel(paymentStatus),
    issuedAt:
      firstString(
        invoice?.issuedAt,
        invoice?.invoiceDate,
        invoice?.createdAt,
        item?.issuedAt,
        item?.invoiceDate,
        item?.createdAt,
      ) ?? null,
    printDate:
      firstString(invoice?.printDate, invoice?.printedAt, item?.printDate, item?.printedAt) ??
      null,
    dueAt: firstString(invoice?.dueAt, invoice?.dueDate, item?.dueAt, item?.dueDate),
    customer: {
      id: firstString(customer?.id, customer?._id, orderCustomer?.id, orderCustomer?._id),
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
    },
    deliveryAddress,
    deliveryAddressLabel: isShopPickup
      ? "Shop Pickup -- no delivery address required."
      : deliveryAddress,
    isShopPickup,
    items,
    paymentMethod: paymentMethodLabel ?? "--",
    subtotalMinor: normalizeMinorAmount(
      invoice?.subtotalMinor,
      invoice?.subTotalMinor,
      invoice?.subtotal?.amountMinor,
      item?.subtotalMinor,
      item?.subtotal,
    ),
    deliveryFeeMinor: normalizeMinorAmount(
      invoice?.deliveryFeeMinor,
      invoice?.deliveryChargeMinor,
      invoice?.shippingFeeMinor,
      item?.deliveryFeeMinor,
      item?.deliveryChargeMinor,
    ),
    discountMinor: normalizeMinorAmount(
      invoice?.discountMinor,
      invoice?.discount?.amountMinor,
      item?.discountMinor,
      item?.discount,
    ),
    taxMinor: normalizeMinorAmount(
      invoice?.taxMinor,
      invoice?.vatMinor,
      invoice?.tax?.amountMinor,
      item?.taxMinor,
      item?.vatMinor,
    ),
    totalMinor: normalizeMinorAmount(
      invoice?.totalMinor,
      invoice?.grandTotalMinor,
      invoice?.total?.amountMinor,
      item?.totalMinor,
      item?.grandTotalMinor,
      item?.total,
    ),
    termsNote: termsNote ?? null,
    pdfPath,
    availableActions: {
      canDownloadPdf: scope === "customer" ? Boolean(pdfPath) : Boolean(pdfPath),
      canIssue:
        firstBoolean(
          invoice?.canIssue,
          item?.canIssue,
          invoice?.availableActions?.canIssue,
          item?.availableActions?.canIssue,
        ) ?? false,
      issue: normalizeAction(invoice?.actions?.issue ?? item?.actions?.issue),
      void: normalizeAction(invoice?.actions?.void ?? item?.actions?.void),
    },
  };
}

export async function downloadInvoicePdf({
  path,
  invoiceNumber,
  fallbackFileName,
}) {
  const result = await apiDownload(path);
  const objectUrl = createObjectUrl(result.blob);
  const fileName =
    result?.fileName ?? fallbackFileName ?? `invoice-${invoiceNumber}.pdf`;

  try {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    revokeObjectUrl(objectUrl);
  }

  return fileName;
}

export async function downloadCustomerInvoicePdf(invoice) {
  const invoiceNumber =
    typeof invoice === "string" ? invoice : invoice?.invoiceNumber;
  const path = endpoints.account.invoiceDownload(invoiceNumber);
  const url = resolveApiRequestUrl(path, { baseUrl: API_BASE_URL });

  if (IS_DEVELOPMENT) {
    console.log("[invoice download] url:", url);
  }

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/pdf, application/json",
    },
  });
  const contentType = response.headers.get("content-type");

  if (IS_DEVELOPMENT) {
    console.log("[invoice download] status:", response.status);
    console.log("[invoice download] content-type:", contentType);
  }

  if (response.ok && contentType?.toLowerCase().includes("application/pdf")) {
    const blob = await response.blob();
    const objectUrl = createObjectUrl(blob);
    const fileName = `invoice-${invoiceNumber}.pdf`;

    try {
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      revokeObjectUrl(objectUrl);
    }

    return fileName;
  }

  let errorBody = null;

  if (contentType?.toLowerCase().includes("application/json")) {
    try {
      errorBody = await response.json();
    } catch {
      errorBody = null;
    }
  } else {
    try {
      const text = await response.text();
      errorBody = text || null;
    } catch {
      errorBody = null;
    }
  }

  const backendMessage =
    findReadableMessage(errorBody?.message) ??
    findReadableMessage(errorBody?.error) ??
    findReadableMessage(errorBody?.errors) ??
    findReadableMessage(errorBody) ??
    (response.status === 404
      ? "Invoice PDF download is not available right now."
      : "Could not download invoice right now.");

  throw createApiError({
    status: response.status,
    code:
      (errorBody && typeof errorBody === "object" && errorBody.code) ||
      (response.status === 404 ? "INVOICE_PDF_NOT_FOUND" : "INVOICE_PDF_DOWNLOAD_FAILED"),
    message: backendMessage,
    details: errorBody,
  });
}

export async function downloadAdminInvoicePdf(invoice) {
  const invoiceNumber =
    typeof invoice === "string" ? invoice : invoice?.invoiceNumber;
  const pdfPath =
    typeof invoice === "string"
      ? endpoints.admin.invoicePdf(invoice)
      : invoice?.pdfPath ?? endpoints.admin.invoicePdf(invoiceNumber);

  return downloadInvoicePdf({
    path: pdfPath,
    invoiceNumber,
    fallbackFileName: `invoice-${invoiceNumber}.pdf`,
  });
}

export async function getCustomerInvoices() {
  const result = await apiGet(endpoints.account.invoices, ACCOUNT_NO_STORE_REQUEST_OPTIONS);
  return normalizeItems(getEnvelopeData(result)).map((item, index) =>
    normalizeInvoiceRecord(item, index, "customer"),
  );
}

export async function getCustomerInvoiceDetail(invoiceNumber) {
  const invoices = await getCustomerInvoices();
  return (
    invoices.find((invoice) => invoice.invoiceNumber === invoiceNumber) ?? null
  );
}

export async function getAdminInvoices() {
  const result = await apiGet(endpoints.admin.invoices, ADMIN_NO_STORE_REQUEST_OPTIONS);
  return normalizeItems(getEnvelopeData(result)).map((item, index) =>
    normalizeInvoiceRecord(item, index, "admin"),
  );
}

export async function getAdminInvoiceDetail(invoiceNumber) {
  const invoices = await getAdminInvoices();
  return (
    invoices.find((invoice) => invoice.invoiceNumber === invoiceNumber) ?? null
  );
}

export async function createAdminInvoiceForOrder(orderNumber) {
  const result = await apiPost(endpoints.admin.invoices, { orderNumber });
  return getEnvelopeData(result);
}

export async function runInvoiceAction(action) {
  if (!action?.path) {
    throw new Error("This invoice action is not available.");
  }

  const result = await apiRequest(action.path, {
    method: action.method ?? "POST",
  });

  return getEnvelopeData(result);
}
