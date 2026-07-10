"use client";

import { apiGet, apiPost, resolveApiRequestUrl } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { normalizeProductDetail } from "@/features/products/product-detail-api";

const deliveryZoneFallbacks = [
  { id: "riyadh", name: "Riyadh" },
  { id: "jeddah", name: "Jeddah" },
  { id: "dammam", name: "Dammam" },
  { id: "mecca", name: "Mecca" },
  { id: "medina", name: "Medina" },
];

const PAYMENT_METHODS = {
  cashOnDelivery: "cash_on_delivery",
  manualAdvancePayment: "manual_advance_payment",
};

function normalizeItems(data) {
  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data)) {
    return data;
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
    const number = Number(value);

    if (Number.isFinite(number)) {
      return number;
    }
  }

  return null;
}

function normalizeDeliveryEstimate(data) {
  const payload = data?.item ?? data?.estimate ?? data?.data ?? data ?? {};

  return {
    feeMinor:
      firstNumber(
        payload?.deliveryFeeMinor,
        payload?.feeMinor,
        payload?.delivery?.amount,
        payload?.priceMinor,
      ) ?? null,
    estimatedDelivery:
      firstString(
        payload?.estimatedDelivery,
        payload?.estimatedDeliveryTime,
        payload?.estimatedDeliveryLabel,
        payload?.deliveryWindow,
      ) ?? null,
    zoneLabel:
      firstString(payload?.zoneLabel, payload?.zoneName, payload?.city, payload?.area) ??
      null,
  };
}

function normalizeOrderSummary(data) {
  const payload = data?.item ?? data?.order ?? data?.data ?? data ?? {};

  return {
    orderNumber:
      firstString(
        payload?.orderNumber,
        payload?.number,
        payload?.referenceNumber,
        payload?.reference,
        payload?.id,
      ) ?? null,
    orderReference:
      firstString(
        payload?.referenceNumber,
        payload?.reference,
        payload?.orderReference,
        payload?.orderNumber,
        payload?.number,
        payload?.id,
      ) ?? null,
    status: firstString(payload?.status, payload?.orderStatus) ?? "Placed",
    paymentMethod:
      firstString(
        payload?.paymentMethod,
        payload?.payment?.method,
      ) ?? PAYMENT_METHODS.cashOnDelivery,
    totalMinor:
      firstNumber(
        payload?.totalMinor,
        payload?.total?.amount,
        payload?.grandTotalMinor,
      ) ?? null,
    deliveryFeeMinor:
      firstNumber(
        payload?.deliveryFeeMinor,
        payload?.delivery?.amount,
        payload?.shippingFeeMinor,
      ) ?? null,
    productName:
      firstString(
        payload?.items?.[0]?.name,
        payload?.items?.[0]?.productName,
        payload?.product?.name,
      ) ?? null,
    productImageUrl:
      firstString(
        payload?.items?.[0]?.imageUrl,
        payload?.product?.imageUrl,
        payload?.product?.primaryImageUrl,
      ) ?? null,
    quantity:
      firstNumber(payload?.items?.[0]?.quantity, payload?.quantity, payload?.qty) ?? 1,
    createdAt: firstString(payload?.createdAt, payload?.placedAt),
    estimatedDelivery:
      firstString(
        payload?.estimatedDelivery,
        payload?.deliveryEstimate,
        payload?.delivery?.estimatedDelivery,
      ) ?? null,
    customerName:
      firstString(payload?.customerName, payload?.shippingAddress?.fullName) ?? null,
  };
}

export async function getCheckoutProduct(productId) {
  const response = await apiGet(endpoints.public.productDetail(productId));
  return normalizeProductDetail(response?.data?.item ?? response?.data?.product ?? response?.data);
}

export async function getDeliveryZones() {
  try {
    const response = await apiGet(endpoints.public.deliveryZones);
    const items = normalizeItems(response?.data);

    if (items.length > 0) {
      return items.map((item) => ({
        id: item?.id ?? item?._id ?? item?.slug ?? item?.name,
        name: item?.name ?? item?.title ?? item?.city ?? "Zone",
      }));
    }
  } catch {
    return deliveryZoneFallbacks;
  }

  return deliveryZoneFallbacks;
}

export async function getDeliveryEstimate(payload) {
  const response = await apiGet(endpoints.public.deliveryEstimate, {
    query: payload,
  });

  return normalizeDeliveryEstimate(response?.data);
}

export async function submitCheckout(payload, idempotencyKey) {
  const checkoutPath = endpoints.orders.checkout;
  const finalUrl = resolveApiRequestUrl(checkoutPath);

  if (process.env.NODE_ENV === "development") {
    console.log("[checkout] POST URL:", finalUrl);
  }

  try {
    const response = await apiPost(checkoutPath, payload, {
      headers: {
        "Idempotency-Key": idempotencyKey,
        "X-Idempotency-Key": idempotencyKey,
      },
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[checkout] success:", response);
    }

    return normalizeOrderSummary(response?.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.log("[checkout] error status:", error?.status ?? null);
      console.log("[checkout] error data:", error?.details ?? null);
      console.log("[checkout] error message:", error?.message ?? null);
    }

    throw error;
  }
}

export { normalizeOrderSummary };
export { PAYMENT_METHODS };
