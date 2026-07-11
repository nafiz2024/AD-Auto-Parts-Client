import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import {
  asArray,
  firstBoolean,
  firstNumber,
  firstString,
  getEnvelopeData,
  normalizeItems,
  normalizePagination,
  sanitizeDisplayUrl,
  uniqueBy,
} from "@/features/admin/order-workflow/admin-workflow-utils";

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_ENQUIRY_STATUSES = ["new", "contacted", "resolved", "closed"];

function enquiryDetailPath(enquiryId) {
  return `${endpoints.admin.enquiries}/${enquiryId}`;
}

function normalizeEnquiryStatus(value) {
  const normalized = (firstString(value) ?? "new").toLowerCase();

  if (normalized.includes("contact")) {
    return "contacted";
  }

  if (normalized.includes("resolve")) {
    return "resolved";
  }

  if (normalized.includes("close")) {
    return "closed";
  }

  return "new";
}

function normalizeVehicleInfo(item) {
  return firstString(
    item?.vehicleInfo,
    item?.vehicleSummary,
    item?.vehicle,
    item?.carModel,
    item?.compatibilitySummary,
  );
}

function normalizeEnquirySummary(item, index = 0) {
  const status = normalizeEnquiryStatus(item?.status ?? item?.enquiryStatus ?? item?.state);

  return {
    id: firstString(item?.id, item?._id, item?.enquiryNumber, `enquiry-${index}`) ?? `enquiry-${index}`,
    enquiryNumber:
      firstString(item?.enquiryNumber, item?.referenceNumber, item?.ticketNumber, item?.id) ??
      `ENQ-${index + 1}`,
    name:
      firstString(item?.fullName, item?.name, item?.customerName, item?.contact?.name) ?? "Customer",
    email: firstString(item?.email, item?.contact?.email, item?.customerEmail) ?? "",
    phone: firstString(item?.phone, item?.mobile, item?.contact?.phone, item?.customerPhone) ?? "",
    subject:
      firstString(item?.requiredPart, item?.subject, item?.title, item?.partName) ?? "Enquiry",
    requiredPart:
      firstString(item?.requiredPart, item?.subject, item?.title, item?.partName) ?? "Used auto part",
    vehicleInfo: normalizeVehicleInfo(item) ?? "",
    enquiryType:
      firstString(item?.enquiryType, item?.type, item?.source, item?.channel) ?? "General",
    message: firstString(item?.message, item?.description, item?.details) ?? "",
    status,
    statusLabel:
      firstString(item?.statusLabel, item?.status, item?.enquiryStatus, item?.state) ?? "New",
    assignedTo:
      firstString(item?.assignedAdminName, item?.assignedTo?.name, item?.owner?.name) ?? "",
    assignedAdminId:
      firstString(
        item?.assignedAdminId,
        item?.assignedTo?.id,
        item?.assignedTo?._id,
        item?.owner?.id,
        item?.owner?._id,
      ) ?? "",
    createdAt: firstString(item?.createdAt, item?.submittedAt, item?.updatedAt) ?? "",
    updatedAt: firstString(item?.updatedAt, item?.lastUpdatedAt, item?.createdAt) ?? "",
    referenceImageUrl: sanitizeDisplayUrl(
      item?.referenceImageUrl ?? item?.safeAttachmentUrl ?? item?.attachmentPreviewUrl,
    ),
    availableActions: {
      canReply:
        firstBoolean(item?.canReply, item?.availableActions?.canReply, item?.actions?.canReply) ?? true,
      canAssign:
        firstBoolean(item?.canAssign, item?.availableActions?.canAssign, item?.actions?.canAssign) ??
        false,
      canResolve:
        firstBoolean(item?.canResolve, item?.availableActions?.canResolve, item?.actions?.canResolve) ??
        (status !== "resolved" && status !== "closed"),
      canClose:
        firstBoolean(item?.canClose, item?.availableActions?.canClose, item?.actions?.canClose) ??
        status !== "closed",
      canUpdateStatus:
        firstBoolean(
          item?.canUpdateStatus,
          item?.availableActions?.canUpdateStatus,
          item?.actions?.canUpdateStatus,
        ) ?? true,
    },
  };
}

function normalizeReply(item, index = 0) {
  return {
    id: firstString(item?.id, item?._id, `reply-${index}`) ?? `reply-${index}`,
    message: firstString(item?.message, item?.body, item?.reply, item?.note) ?? "",
    createdAt: firstString(item?.createdAt, item?.updatedAt) ?? "",
    author: firstString(item?.author?.name, item?.createdBy?.name, item?.authorName) ?? "",
    status:
      firstString(item?.statusLabel, item?.status, item?.visibility, item?.type) ?? "",
    publicVisible:
      firstBoolean(item?.publicVisible, item?.isPublic, item?.visibleToCustomer) ?? true,
  };
}

function normalizeEnquiryDetail(item) {
  const summary = normalizeEnquirySummary(item);

  return {
    ...summary,
    latestUpdateAt:
      firstString(item?.latestUpdateAt, item?.updatedAt, item?.lastUpdatedAt, item?.createdAt) ?? "",
    internalNotesSupported:
      firstBoolean(
        item?.internalNotesSupported,
        item?.availableActions?.supportsInternalNotes,
        item?.supportsInternalNotes,
      ) ?? false,
    followUpDateSupported:
      firstBoolean(
        item?.followUpDateSupported,
        item?.availableActions?.supportsFollowUpDate,
        item?.supportsFollowUpDate,
      ) ?? false,
    assignedAdminOptions: uniqueBy(
      asArray(item?.assignableAdmins ?? item?.adminOptions).map((admin, index) => ({
        id: firstString(admin?.id, admin?._id, admin?.email, `admin-${index}`) ?? `admin-${index}`,
        name: firstString(admin?.name, admin?.email, admin?.title) ?? "Admin",
      })),
      (entry) => entry.id,
    ),
    availableStatuses: (() => {
      const statuses = uniqueBy(
        asArray(item?.availableStatuses).map((status, index) => {
          if (typeof status === "string") {
            return {
              id: normalizeEnquiryStatus(status) || `status-${index}`,
              value: normalizeEnquiryStatus(status),
              label: status,
            };
          }

          return {
            id:
              firstString(
                status?.id,
                status?.value,
                normalizeEnquiryStatus(status?.label),
                `status-${index}`,
              ) ?? `status-${index}`,
            value: normalizeEnquiryStatus(status?.value ?? status?.status ?? status?.label),
            label: firstString(status?.label, status?.value, status?.status) ?? "New",
          };
        }),
        (entry) => entry.id,
      );

      if (statuses.length > 0) {
        return statuses;
      }

      return DEFAULT_ENQUIRY_STATUSES.map((status) => ({
        id: status,
        value: status,
        label: status,
      }));
    })(),
    replies: uniqueBy(
      asArray(item?.replies ?? item?.history ?? item?.messages).map(normalizeReply),
      (entry) => entry.id,
    ),
  };
}

function normalizeEnquiryMeta(payload, items) {
  const meta = payload?.meta ?? {};
  const capabilities = payload?.capabilities ?? meta?.capabilities ?? {};
  const summary = payload?.summary ?? meta?.summary ?? {};
  const statusCounts = summary?.statusCounts ?? meta?.statusCounts ?? [];
  const countsMap = new Map();

  asArray(statusCounts).forEach((entry) => {
    const key = normalizeEnquiryStatus(entry?.status ?? entry?.key ?? entry?.value);
    const count = firstNumber(entry?.count, entry?.total, entry?.value) ?? 0;

    if (key) {
      countsMap.set(key, count);
    }
  });

  if (countsMap.size === 0) {
    items.forEach((item) => {
      countsMap.set(item.status, (countsMap.get(item.status) ?? 0) + 1);
    });
  }

  return {
    capabilities: {
      canExport: firstBoolean(capabilities?.canExport, meta?.canExport, payload?.canExport) ?? false,
      canCreateManual:
        firstBoolean(capabilities?.canCreateManual, meta?.canCreateManual, payload?.canCreateManual) ??
        false,
    },
    statusTabs: [
      {
        key: "all",
        label: "All",
        count:
          firstNumber(meta?.totalItems, meta?.total, summary?.totalEnquiries, items.length) ??
          items.length,
      },
      ...DEFAULT_ENQUIRY_STATUSES.filter((status) => countsMap.has(status)).map((status) => ({
        key: status,
        label: status,
        count: countsMap.get(status) ?? 0,
      })),
    ],
  };
}

export async function getAdminEnquiries(filters = {}) {
  const query = {
    page: filters.page ?? 1,
    limit: filters.limit ?? DEFAULT_PAGE_SIZE,
    search: filters.q || undefined,
    status: filters.status || undefined,
    createdFrom: filters.dateFrom || undefined,
    createdTo: filters.dateTo || undefined,
  };

  const result = await apiGet(endpoints.admin.enquiries, { query });
  const payload = getEnvelopeData(result);
  const items = normalizeItems(payload).map(normalizeEnquirySummary);
  const meta = normalizeEnquiryMeta(payload, items);

  return {
    items,
    pagination: normalizePagination(payload?.meta ?? result?.meta, query.page, query.limit),
    capabilities: meta.capabilities,
    statusTabs: meta.statusTabs,
  };
}

export async function getAdminEnquiryDetail(enquiryId) {
  const result = await apiGet(enquiryDetailPath(enquiryId));
  const payload = getEnvelopeData(result);
  const item = payload?.enquiry ?? payload?.data ?? payload;

  return normalizeEnquiryDetail(item);
}

export async function updateAdminEnquiry(enquiryId, payload) {
  const result = await apiPatch(enquiryDetailPath(enquiryId), payload);
  return getEnvelopeData(result);
}

export async function createAdminManualEnquiry(payload) {
  const result = await apiPost(endpoints.admin.enquiries, payload);
  return getEnvelopeData(result);
}
