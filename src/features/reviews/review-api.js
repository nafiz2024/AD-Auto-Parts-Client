import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import {
  asArray,
  buildDetailPath,
  firstBoolean,
  firstNumber,
  firstString,
  getEnvelopeData,
  normalizeItems,
  normalizePagination,
  normalizeDate,
  sanitizeDisplayUrl,
  uniqueBy,
} from "@/features/feedback/feedback-utils";

const DEFAULT_PAGE_SIZE = 6;
const ACCOUNT_REQUEST_OPTIONS = {
  credentials: "include",
};

function isPublicReview(review) {
  return review.availableActions.publicVisible || review.status === "published";
}

function normalizeReviewStatus(value) {
  const normalized = (firstString(value) ?? "pending").toLowerCase();

  if (normalized.includes("publish") || normalized.includes("approve")) {
    return "published";
  }

  if (normalized.includes("reject")) {
    return "rejected";
  }

  if (normalized.includes("hide")) {
    return "hidden";
  }

  return "pending";
}

function normalizeAvailableActions(item, fallbackPublic = false) {
  const actions = item?.availableActions ?? item?.actions ?? {};

  return {
    canEdit:
      firstBoolean(item?.canEdit, actions?.canEdit, actions?.edit) ?? false,
    canDelete:
      firstBoolean(item?.canDelete, actions?.canDelete, actions?.delete) ?? false,
    canPublish:
      firstBoolean(item?.canPublish, actions?.canPublish, actions?.publish) ?? false,
    canReject:
      firstBoolean(item?.canReject, actions?.canReject, actions?.reject) ?? false,
    canHide:
      firstBoolean(item?.canHide, actions?.canHide, actions?.hide) ?? false,
    publishPath: firstString(actions?.publishPath, actions?.approvePath),
    rejectPath: firstString(actions?.rejectPath),
    hidePath: firstString(actions?.hidePath),
    deletePath: firstString(actions?.deletePath),
    editPath: firstString(actions?.editPath),
    publicVisible:
      firstBoolean(
        item?.publicVisible,
        item?.isPublic,
        item?.published,
        actions?.publicVisible,
      ) ?? fallbackPublic,
  };
}

function normalizeReview(item, index = 0) {
  const status = normalizeReviewStatus(item?.status ?? item?.moderationStatus);
  const productId = firstString(item?.productId, item?.product?.id, item?.product?._id);
  const productSlug = firstString(item?.productSlug, item?.product?.slug, productId);
  const availableActions = normalizeAvailableActions(item, status === "published");

  return {
    id: firstString(item?.id, item?._id, item?.reviewNumber, `review-${index}`) ?? `review-${index}`,
    reviewNumber:
      firstString(item?.reviewNumber, item?.referenceNumber, item?.id) ?? `RVW-${index + 1}`,
    productId,
    productSlug,
    productName:
      firstString(item?.productName, item?.product?.name, item?.title) ?? "Used auto part",
    productImageUrl: sanitizeDisplayUrl(
      item?.productImageUrl ??
        item?.product?.imageUrl ??
        item?.product?.primaryImageUrl ??
        item?.product?.thumbnailUrl,
    ),
    reviewerName:
      firstString(
        item?.reviewerName,
        item?.customerDisplayName,
        item?.customer?.name,
        item?.author?.name,
      ) ?? "Verified customer",
    customerName:
      firstString(
        item?.customerDisplayName,
        item?.customer?.name,
        item?.reviewerName,
      ) ?? "Customer",
    customerEmail: firstString(item?.customer?.email, item?.customerEmail),
    rating: firstNumber(item?.rating, item?.score, item?.stars),
    title: firstString(item?.title, item?.headline),
    comment:
      firstString(item?.comment, item?.review, item?.message, item?.content) ?? "",
    verifiedBuyer:
      firstBoolean(item?.verifiedBuyer, item?.isVerifiedBuyer, item?.verifiedPurchase) ?? false,
    status,
    statusLabel:
      firstString(item?.statusLabel, item?.moderationStatusLabel, item?.status) ?? "Pending",
    rejectionReason: firstString(item?.rejectionReason, item?.publicReason),
    moderationNote: firstString(item?.moderationNote, item?.internalNote),
    moderationHistory: uniqueBy(
      asArray(item?.moderationHistory).map((entry, entryIndex) => ({
        id:
          firstString(entry?.id, entry?._id, `history-${entryIndex}`) ??
          `history-${entryIndex}`,
        status:
          firstString(entry?.statusLabel, entry?.status, entry?.action) ?? "Updated",
        note: firstString(entry?.note, entry?.reason, entry?.message),
        createdAt: normalizeDate(entry?.createdAt ?? entry?.updatedAt),
        author: firstString(entry?.author?.name, entry?.createdBy?.name, entry?.adminName),
      })),
      (entry) => entry.id,
    ),
    createdAt: normalizeDate(item?.createdAt ?? item?.submittedAt),
    updatedAt: normalizeDate(item?.updatedAt ?? item?.moderatedAt ?? item?.createdAt),
    availableActions,
  };
}

function normalizeRatingBreakdown(summary, items) {
  const rawBreakdown =
    summary?.ratingBreakdown ??
    summary?.breakdown ??
    summary?.ratings ??
    summary?.distribution ??
    {};
  const counts = new Map();

  if (Array.isArray(rawBreakdown)) {
    rawBreakdown.forEach((entry) => {
      const star = firstNumber(entry?.rating, entry?.stars, entry?.value, entry?.key);
      const count = firstNumber(entry?.count, entry?.total, entry?.value);

      if (star !== null) {
        counts.set(star, count ?? 0);
      }
    });
  } else if (rawBreakdown && typeof rawBreakdown === "object") {
    Object.entries(rawBreakdown).forEach(([key, value]) => {
      const star = firstNumber(key);
      const count = firstNumber(value?.count, value?.total, value);

      if (star !== null) {
        counts.set(star, count ?? 0);
      }
    });
  }

  if (counts.size === 0) {
    items.forEach((item) => {
      if (item.rating) {
        counts.set(item.rating, (counts.get(item.rating) ?? 0) + 1);
      }
    });
  }

  return [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: counts.get(rating) ?? 0,
  }));
}

function normalizeSummary(payload, items) {
  const meta = payload?.meta ?? {};
  const summary = payload?.summary ?? meta?.summary ?? payload?.ratingsSummary ?? {};

  return {
    averageRating:
      firstNumber(
        summary?.averageRating,
        summary?.ratingAverage,
        meta?.averageRating,
      ) ?? null,
    reviewCount:
      firstNumber(
        summary?.reviewCount,
        summary?.totalReviews,
        meta?.totalItems,
        items.length,
      ) ?? items.length,
    ratingBreakdown: normalizeRatingBreakdown(summary, items),
  };
}

function normalizeCapabilities(payload) {
  const capabilities = payload?.capabilities ?? payload?.meta?.capabilities ?? {};

  return {
    canSubmit:
      firstBoolean(capabilities?.canSubmit, payload?.canSubmitReview) ?? true,
    requiresAuthToSubmit:
      firstBoolean(capabilities?.requiresAuthToSubmit, payload?.requiresAuth) ?? true,
    supportsTitle:
      firstBoolean(capabilities?.supportsTitle, payload?.supportsTitle) ?? true,
  };
}

function normalizeReviewCollection(result, fallbackPage = 1, fallbackPageSize = DEFAULT_PAGE_SIZE) {
  const payload = getEnvelopeData(result);
  const items = normalizeItems(payload).map(normalizeReview);

  return {
    items,
    pagination: normalizePagination(payload?.meta ?? result?.meta, fallbackPage, fallbackPageSize),
    summary: normalizeSummary(payload, items),
    capabilities: normalizeCapabilities(payload),
  };
}

function normalizePublicReviewCollection(result, fallbackPage = 1, fallbackPageSize = DEFAULT_PAGE_SIZE) {
  const collection = normalizeReviewCollection(result, fallbackPage, fallbackPageSize);
  const publicItems = collection.items.filter(isPublicReview);

  if (publicItems.length === collection.items.length) {
    return collection;
  }

  return {
    ...collection,
    items: publicItems,
    summary: normalizeSummary(getEnvelopeData(result), publicItems),
  };
}

export async function getPublicProductReviews(productId, options = {}) {
  const page = options.page ?? 1;
  const limit = options.limit ?? DEFAULT_PAGE_SIZE;
  const result = await apiGet(endpoints.public.reviews, {
    query: {
      productId,
      page,
      limit,
    },
  });

  return normalizePublicReviewCollection(result, page, limit);
}

export async function getCustomerReviews(options = {}) {
  const page = options.page ?? 1;
  const limit = options.limit ?? DEFAULT_PAGE_SIZE;
  const result = await apiGet(endpoints.account.reviews, ACCOUNT_REQUEST_OPTIONS);
  return normalizeReviewCollection(result, page, limit);
}

export async function createCustomerReview(payload) {
  const result = await apiPost(endpoints.customer.reviews, payload);
  const data = getEnvelopeData(result);
  return normalizeReview(data?.review ?? data);
}

export async function updateCustomerReview(reviewId, payload) {
  const result = await apiPatch(buildDetailPath(endpoints.customer.reviews, reviewId), payload);
  const data = getEnvelopeData(result);
  return normalizeReview(data?.review ?? data);
}

export async function deleteCustomerReview(reviewId) {
  return apiDelete(buildDetailPath(endpoints.customer.reviews, reviewId));
}

export { normalizeReview, normalizeReviewStatus };
