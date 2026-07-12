import { apiGet, apiPatch } from "@/lib/api/client";
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
  sanitizeDisplayUrl,
  uniqueBy,
} from "@/features/admin/order-workflow/admin-workflow-utils";

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_CUSTOMER_STATUSES = ["active", "inactive", "blocked"];

function customerDetailPath(customerId) {
  return `${endpoints.admin.customers}/${customerId}`;
}

function normalizeCustomerStatus(value) {
  const normalized = (firstString(value) ?? "active").toLowerCase();

  if (normalized.includes("block") || normalized.includes("suspend")) {
    return "blocked";
  }

  if (normalized.includes("inactive") || normalized.includes("disable")) {
    return "inactive";
  }

  return "active";
}

function formatVehicleSummary(item) {
  return firstString(
    item?.vehicleSummary,
    item?.vehicle,
    item?.vehicleInfo,
    item?.carModel,
    item?.compatibilitySummary,
  );
}

function normalizeOrderPreview(item, index = 0) {
  return {
    id: firstString(item?.id, item?._id, item?.orderNumber, `order-${index}`) ?? `order-${index}`,
    orderNumber: firstString(item?.orderNumber, item?.number, item?.id) ?? `ORD-${index + 1}`,
    createdAt: firstString(item?.createdAt, item?.placedAt, item?.date, item?.updatedAt) ?? "",
    status: normalizeCustomerStatus(item?.status ?? item?.orderStatus),
    statusLabel:
      firstString(item?.statusLabel, item?.orderStatusLabel, item?.status, item?.orderStatus) ??
      "Pending",
    totalMinor: normalizeMinorAmount(
      item?.totalMinor,
      item?.grandTotalMinor,
      item?.total?.amountMinor,
      item?.total?.amount,
    ) ?? 0,
  };
}

function normalizeEnquiryPreview(item, index = 0) {
  return {
    id: firstString(item?.id, item?._id, item?.enquiryNumber, `enquiry-${index}`) ?? `enquiry-${index}`,
    enquiryNumber:
      firstString(item?.enquiryNumber, item?.referenceNumber, item?.id, item?._id) ??
      `ENQ-${index + 1}`,
    subject:
      firstString(item?.requiredPart, item?.subject, item?.title, item?.partName) ?? "Enquiry",
    status:
      firstString(item?.statusLabel, item?.status, item?.enquiryStatus, item?.state) ?? "New",
    createdAt: firstString(item?.createdAt, item?.submittedAt, item?.updatedAt) ?? "",
  };
}

function normalizeCustomerSummary(item, index = 0) {
  const status = normalizeCustomerStatus(item?.status ?? item?.accountStatus ?? item?.state);
  const reviewCount =
    firstNumber(item?.reviewCount, item?.reviewsCount, item?.totals?.reviews, item?.stats?.reviews) ??
    0;
  const questionCount =
    firstNumber(item?.questionCount, item?.questionsCount, item?.totals?.questions, item?.stats?.questions) ??
    0;
  const enquiryCount =
    firstNumber(item?.enquiryCount, item?.enquiriesCount, item?.totals?.enquiries, item?.stats?.enquiries) ??
    0;

  const totalSpent = firstNumber(item?.totalSpent, item?.total_spent);
  const totalSpentMinor = firstNumber(item?.totalSpentMinor, item?.total_spent_minor);

  return {
    id: firstString(item?.id, item?._id, item?.customerId, `customer-${index}`) ?? `customer-${index}`,
    customerNumber:
      firstString(item?.customerNumber, item?.number, item?.referenceNumber) ?? "",
    name: firstString(item?.name, item?.fullName, item?.customerName) ?? "Customer",
    email: firstString(item?.email, item?.contact?.email, item?.customerEmail) ?? "",
    phone: firstString(item?.phone, item?.mobile, item?.contact?.phone, item?.customerPhone) ?? "",
    status,
    statusLabel:
      firstString(item?.statusLabel, item?.accountStatusLabel, item?.status, item?.accountStatus) ??
      "Active",
    createdAt: firstString(item?.createdAt, item?.customerSince, item?.registeredAt, item?.updatedAt) ?? "",
    lastOrderDate: firstString(item?.lastOrderDate, item?.lastOrder?.createdAt, item?.lastPurchaseAt) ?? "",
    totalOrders:
      firstNumber(item?.totalOrders, item?.ordersCount, item?.totals?.orders, item?.stats?.orders) ?? 0,
    totalSpentMinor:
      totalSpentMinor ??
      (totalSpent !== null ? Math.round(totalSpent * 100) : null) ??
      normalizeMinorAmount(
        item?.totals?.spentMinor,
        item?.stats?.spentMinor,
        item?.totalSpent?.amountMinor,
      ) ??
      0,
    averageOrderMinor:
      normalizeMinorAmount(
        item?.averageOrderMinor,
        item?.totals?.averageOrderMinor,
        item?.stats?.averageOrderMinor,
        item?.averageOrder?.amountMinor,
      ) ?? 0,
    reviewCount,
    questionCount,
    enquiryCount,
    defaultAddress:
      normalizeAddress(item?.defaultAddress) ??
      normalizeAddress(item?.address) ??
      normalizeAddress(item?.shippingAddress) ??
      "",
    avatarUrl: sanitizeDisplayUrl(item?.avatarUrl ?? item?.profileImageUrl ?? item?.imageUrl),
    recentOrders: uniqueBy(
      asArray(item?.recentOrders ?? item?.ordersPreview).map(normalizeOrderPreview),
      (entry) => entry.id,
    ),
    recentEnquiries: uniqueBy(
      asArray(item?.recentEnquiries ?? item?.enquiriesPreview).map(normalizeEnquiryPreview),
      (entry) => entry.id,
    ),
    availableActions: {
      canActivate:
        firstBoolean(item?.canActivate, item?.availableActions?.canActivate, item?.actions?.canActivate) ??
        status !== "active",
      canDeactivate:
        firstBoolean(item?.canDeactivate, item?.availableActions?.canDeactivate, item?.actions?.canDeactivate) ??
        status === "active",
      canBlock:
        firstBoolean(item?.canBlock, item?.availableActions?.canBlock, item?.actions?.canBlock) ??
        status !== "blocked",
      canUnblock:
        firstBoolean(item?.canUnblock, item?.availableActions?.canUnblock, item?.actions?.canUnblock) ??
        status === "blocked",
      canViewOrders:
        firstBoolean(
          item?.canViewOrders,
          item?.availableActions?.canViewOrders,
          item?.actions?.canViewOrders,
        ) ?? true,
      canViewEnquiries:
        firstBoolean(
          item?.canViewEnquiries,
          item?.availableActions?.canViewEnquiries,
          item?.actions?.canViewEnquiries,
        ) ?? true,
      canFilterOrdersByCustomer:
        firstBoolean(
          item?.canFilterOrdersByCustomer,
          item?.availableActions?.canFilterOrdersByCustomer,
          item?.actions?.canFilterOrdersByCustomer,
        ) ?? false,
    },
  };
}

function normalizeCustomerDetail(item) {
  const summary = normalizeCustomerSummary(item);

  return {
    ...summary,
    notes: uniqueBy(
      asArray(item?.adminNotes ?? item?.notes).map((note, index) => ({
        id: firstString(note?.id, note?._id, `note-${index}`) ?? `note-${index}`,
        body: firstString(note?.body, note?.note, note?.message, note?.content) ?? "",
        createdAt: firstString(note?.createdAt, note?.updatedAt) ?? "",
      })),
      (entry) => entry.id,
    ),
    recentOrders: uniqueBy(
      asArray(item?.recentOrders ?? item?.orders ?? summary.recentOrders).map(normalizeOrderPreview),
      (entry) => entry.id,
    ),
    recentEnquiries: uniqueBy(
      asArray(item?.recentEnquiries ?? item?.enquiries ?? summary.recentEnquiries).map(
        normalizeEnquiryPreview,
      ),
      (entry) => entry.id,
    ),
    orderSummary: {
      totalOrders: summary.totalOrders,
      totalSpentMinor: summary.totalSpentMinor,
      averageOrderMinor: summary.averageOrderMinor,
      reviewCount: summary.reviewCount,
      questionCount: summary.questionCount,
      enquiryCount: summary.enquiryCount,
    },
    availableStatuses: (() => {
      const statuses = asArray(item?.availableStatuses).map((status) =>
        normalizeCustomerStatus(status),
      );

      return statuses.length > 0 ? statuses : DEFAULT_CUSTOMER_STATUSES;
    })(),
  };
}

function normalizeCustomerMeta(payload, items) {
  const meta = payload?.meta ?? {};
  const capabilities = payload?.capabilities ?? meta?.capabilities ?? {};
  const summary = payload?.summary ?? meta?.summary ?? {};
  const statusCounts = summary?.statusCounts ?? meta?.statusCounts ?? [];
  const countsMap = new Map();

  asArray(statusCounts).forEach((entry) => {
    const key = normalizeCustomerStatus(entry?.status ?? entry?.key ?? entry?.value);
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
      canCreateManual: false,
    },
    statusTabs: [
      {
        key: "all",
        label: "All",
        count:
          firstNumber(meta?.totalItems, meta?.total, summary?.totalCustomers, items.length) ?? items.length,
      },
      ...DEFAULT_CUSTOMER_STATUSES.filter((status) => countsMap.has(status)).map((status) => ({
        key: status,
        label: status,
        count: countsMap.get(status) ?? 0,
      })),
    ],
  };
}

export async function getAdminCustomers(filters = {}) {
  const query = {
    page: filters.page ?? 1,
    limit: filters.limit ?? DEFAULT_PAGE_SIZE,
    search: filters.q || undefined,
    searchField: filters.searchField || undefined,
    accountStatus: filters.status || undefined,
    createdFrom: filters.dateFrom || undefined,
    createdTo: filters.dateTo || undefined,
  };

  const result = await apiGet(endpoints.admin.customers, {
    query,
    credentials: "include",
  });
  const payload = getEnvelopeData(result);
  const items = normalizeItems(payload).map(normalizeCustomerSummary);
  const meta = normalizeCustomerMeta(payload, items);

  return {
    items,
    pagination: normalizePagination(payload?.meta ?? result?.meta, query.page, query.limit),
    capabilities: meta.capabilities,
    statusTabs: meta.statusTabs,
  };
}

export async function getAdminCustomerDetail(customerId) {
  const result = await apiGet(customerDetailPath(customerId), {
    credentials: "include",
  });
  const payload = getEnvelopeData(result);
  const item = payload?.customer ?? payload?.data ?? payload;

  return normalizeCustomerDetail(item);
}

export async function updateAdminCustomerStatus(customerId, payload) {
  const result = await apiPatch(customerDetailPath(customerId), payload, {
    credentials: "include",
  });
  return getEnvelopeData(result);
}
