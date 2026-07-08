import { apiGet, apiPatch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import {
  firstBoolean,
  firstNumber,
  firstString,
  getEnvelopeData,
  normalizeItems,
  normalizeMinorAmount,
  normalizePagination,
  sanitizeDisplayUrl,
} from "@/features/admin/order-workflow/admin-workflow-utils";

const DEFAULT_PAGE_SIZE = 10;

function paymentDetailPath(paymentId) {
  return `${endpoints.admin.payments}/${paymentId}`;
}

function normalizePaymentStatus(value) {
  const normalized = (firstString(value) ?? "pending").toLowerCase();

  if (normalized.includes("approve") || normalized.includes("paid")) {
    return "approved";
  }

  if (normalized.includes("reject")) {
    return "rejected";
  }

  return "pending";
}

function normalizePaymentSummary(item, index = 0) {
  return {
    id:
      firstString(item?.id, item?._id, item?.referenceNumber, `payment-${index}`) ??
      `payment-${index}`,
    orderNumber:
      firstString(item?.orderNumber, item?.order?.orderNumber, item?.reference) ?? "—",
    customerName:
      firstString(item?.customer?.name, item?.customerName, item?.order?.customerName) ??
      "Customer",
    customerContact:
      firstString(
        item?.customer?.phone,
        item?.customer?.email,
        item?.customerContact,
        item?.order?.customerPhone,
      ) ?? "—",
    amountMinor: normalizeMinorAmount(
      item?.amountMinor,
      item?.amount?.amountMinor,
      item?.amount?.amount,
      item?.submittedAmountMinor,
    ) ?? 0,
    status: normalizePaymentStatus(item?.status ?? item?.paymentStatus),
    statusLabel: firstString(item?.statusLabel, item?.status, item?.paymentStatus) ?? "Pending",
    submittedAt: firstString(item?.submittedAt, item?.createdAt, item?.paymentDate),
    paymentDate: firstString(item?.paymentDate, item?.submittedAt, item?.createdAt),
    referenceNumber:
      firstString(item?.referenceNumber, item?.transactionReference, item?.transactionId) ?? "",
    note: firstString(item?.note, item?.notes, item?.message) ?? "",
    proofUrl: sanitizeDisplayUrl(
      item?.proofUrl ?? item?.safeProofUrl ?? item?.downloadUrl ?? item?.previewUrl,
    ),
    canApprove:
      firstBoolean(
        item?.canApprove,
        item?.availableActions?.canApprove,
        item?.actions?.canApprove,
      ) ?? normalizePaymentStatus(item?.status ?? item?.paymentStatus) === "pending",
    canReject:
      firstBoolean(
        item?.canReject,
        item?.availableActions?.canReject,
        item?.actions?.canReject,
      ) ?? normalizePaymentStatus(item?.status ?? item?.paymentStatus) === "pending",
  };
}

export async function getAdminPayments(filters = {}) {
  const query = {
    page: filters.page ?? 1,
    limit: filters.limit ?? DEFAULT_PAGE_SIZE,
    status: filters.status || undefined,
    orderNumber: filters.orderNumber || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  };

  const result = await apiGet(endpoints.admin.payments, { query });
  const payload = getEnvelopeData(result);

  return {
    items: normalizeItems(payload).map(normalizePaymentSummary),
    pagination: normalizePagination(payload?.meta ?? result?.meta, query.page, query.limit),
  };
}

export async function updateAdminPaymentStatus(paymentId, payload) {
  const result = await apiPatch(paymentDetailPath(paymentId), payload);
  return getEnvelopeData(result);
}
