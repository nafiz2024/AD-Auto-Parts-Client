"use client";

import {
  apiDownload,
  apiGet,
  apiPost,
  apiRequest,
  createObjectUrl,
  revokeObjectUrl,
} from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { API_BASE_URL } from "@/config/env";

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
      ) ?? "Used auto part",
    description:
      firstString(item?.description, item?.summary, item?.product?.description) ?? "",
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
  const deliveryAddress =
    normalizeAddress(invoice?.deliveryAddress) ??
    normalizeAddress(invoice?.shippingAddress) ??
    normalizeAddress(order?.deliveryAddress) ??
    normalizeAddress(order?.shippingAddress);
  const backendInvoiceNumber = firstString(
    invoice?.invoiceNumber,
    invoice?.number,
    item?.invoiceNumber,
    item?.number,
  );
  const invoiceStatus =
    firstString(
      invoice?.invoiceStatus,
      invoice?.status,
      item?.invoiceStatus,
      item?.status,
      invoice?.state,
    ) ?? "Pending";
  const paymentStatus =
    firstString(
      invoice?.paymentStatus,
      payment?.status,
      item?.paymentStatus,
      item?.status,
    ) ?? "Pending";
  const pdfPath =
    scope === "customer"
      ? backendInvoiceNumber
        ? endpoints.customer.invoicePdf(backendInvoiceNumber)
        : null
      : resolveSafeApiPath(
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
    invoice?.items ??
      invoice?.lines ??
      invoice?.products ??
      order?.items ??
      order?.lines,
  ).map(normalizeInvoiceItem);

  return {
    id:
      firstString(invoice?.id, invoice?._id, invoice?.invoiceNumber, item?.id, `invoice-${index}`) ??
      `invoice-${index}`,
    invoiceNumber:
      backendInvoiceNumber ?? `INV-${index + 1}`,
    orderNumber:
      firstString(invoice?.orderNumber, order?.orderNumber, item?.orderNumber, order?.number),
    invoiceStatus,
    paymentStatus,
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
      name:
        firstString(customer?.name, customer?.fullName, item?.customerName, orderCustomer?.name) ??
        "Customer",
      phone: firstString(customer?.phone, orderCustomer?.phone, item?.customerPhone),
      email: firstString(customer?.email, orderCustomer?.email, item?.customerEmail),
    },
    deliveryAddress,
    items,
    paymentMethod:
      firstString(invoice?.paymentMethod, payment?.method, item?.paymentMethod) ?? "—",
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
    termsNote:
      firstString(
        invoice?.termsNote,
        invoice?.warrantyNote,
        invoice?.termsAndConditions,
        item?.termsNote,
        item?.warrantyNote,
      ) ?? null,
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

export async function downloadCustomerInvoicePdf(invoiceNumber) {
  return downloadInvoicePdf({
    path: endpoints.customer.invoicePdf(invoiceNumber),
    invoiceNumber,
  });
}

export async function downloadAdminInvoicePdf(invoice) {
  if (!invoice?.pdfPath) {
    throw new Error("A secure backend PDF route is not available for this invoice.");
  }

  return downloadInvoicePdf({
    path: invoice.pdfPath,
    invoiceNumber: invoice.invoiceNumber,
  });
}

export async function getCustomerInvoices() {
  const result = await apiGet(endpoints.customer.invoices);
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
  const result = await apiGet(endpoints.admin.invoices);
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
