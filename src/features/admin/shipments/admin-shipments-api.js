import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import {
  firstBoolean,
  firstString,
  getEnvelopeData,
  normalizeItems,
  normalizePagination,
} from "@/features/admin/order-workflow/admin-workflow-utils";

const DEFAULT_PAGE_SIZE = 10;
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

function shipmentDetailPath(shipmentId) {
  return `${endpoints.admin.shipments}/${shipmentId}`;
}

function normalizeShipmentStatus(value) {
  return (firstString(value) ?? "pending").toLowerCase().replace(/\s+/g, "_");
}

function normalizeShipmentSummary(item, index = 0) {
  return {
    id:
      firstString(item?.id, item?._id, item?.shipmentNumber, `shipment-${index}`) ??
      `shipment-${index}`,
    shipmentNumber:
      firstString(item?.shipmentNumber, item?.trackingNumber, item?.reference) ??
      `SHP-${index + 1}`,
    orderNumber:
      firstString(item?.orderNumber, item?.order?.orderNumber, item?.referenceOrderNumber) ??
      "—",
    customerName:
      firstString(item?.customer?.name, item?.customerName, item?.order?.customerName) ??
      "Customer",
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
    canUpdate:
      firstBoolean(
        item?.canUpdate,
        item?.availableActions?.canUpdate,
        item?.actions?.canUpdate,
      ) ?? true,
  };
}

function normalizeCourier(item, index = 0) {
  return {
    id: firstString(item?.id, item?._id, item?.code, `courier-${index}`) ?? `courier-${index}`,
    name: firstString(item?.name, item?.title, item?.label, item?.code) ?? "Courier",
  };
}

export async function getAdminShipments(filters = {}) {
  const query = {
    page: filters.page ?? 1,
    limit: filters.limit ?? DEFAULT_PAGE_SIZE,
    shipmentStatus: filters.status || undefined,
    courier: filters.courier || undefined,
    search: filters.orderNumber || undefined,
    createdFrom: filters.dateFrom || undefined,
    createdTo: filters.dateTo || undefined,
  };

  const result = await apiGet(endpoints.admin.shipments, { query });
  const payload = getEnvelopeData(result);

  return {
    items: normalizeItems(payload).map(normalizeShipmentSummary),
    pagination: normalizePagination(payload?.meta ?? result?.meta, query.page, query.limit),
    availableStatuses: DEFAULT_SHIPMENT_STATUSES,
  };
}

export async function getAdminCourierList() {
  const result = await apiGet(endpoints.admin.couriers);
  const payload = getEnvelopeData(result);
  return normalizeItems(payload).map(normalizeCourier);
}

export async function updateAdminShipmentStatus(shipmentId, payload) {
  const result = await apiPatch(shipmentDetailPath(shipmentId), payload);
  return getEnvelopeData(result);
}

export async function createAdminShipment(payload) {
  const result = await apiPost(endpoints.admin.shipments, payload);
  return getEnvelopeData(result);
}
