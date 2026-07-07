"use client";

import { apiGet } from "@/lib/api/client";
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

export function normalizeTrackingOrder(data) {
  const payload = data?.item ?? data?.order ?? data?.data ?? data ?? {};
  const orderSummary = normalizeOrderSummary(payload);

  return {
    ...orderSummary,
    paymentStatus: firstString(payload?.paymentStatus, payload?.payment?.status) ?? "Pending",
    shipmentStatus:
      firstString(payload?.shipmentStatus, payload?.shipment?.status, payload?.status) ??
      "Processing",
    courierName:
      firstString(payload?.courierName, payload?.shipment?.courierName) ?? null,
    trackingNumber:
      firstString(payload?.trackingNumber, payload?.shipment?.trackingNumber) ?? null,
    orderItems: Array.isArray(payload?.items) ? payload.items : [],
    statusTimeline: Array.isArray(payload?.statusTimeline)
      ? payload.statusTimeline
      : Array.isArray(payload?.timeline)
        ? payload.timeline
        : [],
    publicPhone:
      firstString(payload?.phone, payload?.shippingAddress?.phone, payload?.customerPhone) ??
      null,
    itemPriceMinor:
      firstNumber(
        payload?.items?.[0]?.priceMinor,
        payload?.items?.[0]?.price?.amount,
      ) ?? null,
  };
}

export async function getCustomerTrackOrder(orderNumber) {
  const response = await apiGet(endpoints.customer.orderDetail(orderNumber));
  return normalizeTrackingOrder(response?.data);
}
