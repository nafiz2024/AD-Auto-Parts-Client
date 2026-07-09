import { apiDelete, apiGet, apiPatch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import {
  buildDetailPath,
  firstBoolean,
  firstNumber,
  firstString,
  getEnvelopeData,
  normalizeItems,
  normalizePagination,
} from "@/features/feedback/feedback-utils";
import { normalizeReview, normalizeReviewStatus } from "@/features/reviews/review-api";

const DEFAULT_PAGE_SIZE = 10;

function reviewActionPath(review, action) {
  if (action === "publish") {
    return firstString(review?.availableActions?.publishPath);
  }

  if (action === "reject") {
    return firstString(review?.availableActions?.rejectPath);
  }

  if (action === "hide") {
    return firstString(review?.availableActions?.hidePath);
  }

  if (action === "delete") {
    return firstString(review?.availableActions?.deletePath);
  }

  return null;
}

function normalizeAdminReview(item, index = 0) {
  const review = normalizeReview(item, index);

  return {
    ...review,
    reviewSummary:
      firstString(review.title, review.comment)?.slice(0, 120) ?? "Customer review",
    productFilterLabel:
      firstString(item?.productName, item?.product?.name, review.productName) ?? review.productName,
    dateRangeSupported:
      firstBoolean(item?.dateRangeSupported, item?.supportsDateRange) ?? true,
    supportsModerationNote:
      firstBoolean(item?.supportsModerationNote, item?.availableActions?.supportsModerationNote) ??
      false,
    supportsRejectionReason:
      firstBoolean(item?.supportsRejectionReason, item?.availableActions?.supportsRejectionReason) ??
      true,
  };
}

function normalizeCapabilities(payload) {
  const capabilities = payload?.capabilities ?? payload?.meta?.capabilities ?? {};

  return {
    canDelete:
      firstBoolean(capabilities?.canDelete, payload?.canDeleteReview) ?? false,
    canModerate:
      firstBoolean(capabilities?.canModerate, payload?.canModerateReview) ?? true,
  };
}

function normalizeAdminCollection(result, fallbackPage = 1, fallbackPageSize = DEFAULT_PAGE_SIZE) {
  const payload = getEnvelopeData(result);
  const items = normalizeItems(payload).map(normalizeAdminReview);

  return {
    items,
    pagination: normalizePagination(payload?.meta ?? result?.meta, fallbackPage, fallbackPageSize),
    capabilities: normalizeCapabilities(payload),
  };
}

export async function getAdminReviews(filters = {}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? DEFAULT_PAGE_SIZE;
  const result = await apiGet(endpoints.admin.reviews, {
    query: {
      page,
      limit,
      q: filters.q || undefined,
      status: filters.status || undefined,
      rating: filters.rating || undefined,
      product: filters.product || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    },
  });

  return normalizeAdminCollection(result, page, limit);
}

export async function getAdminReviewDetail(reviewId) {
  const result = await apiGet(buildDetailPath(endpoints.admin.reviews, reviewId));
  const payload = getEnvelopeData(result);
  return normalizeAdminReview(payload?.review ?? payload);
}

export async function moderateAdminReview(review, action, payload = {}) {
  const path = reviewActionPath(review, action) || buildDetailPath(endpoints.admin.reviews, review.id);
  const body = {
    action,
    status:
      action === "publish"
        ? "published"
        : action === "reject"
          ? "rejected"
          : action === "hide"
            ? "hidden"
            : undefined,
    rejectionReason: payload.rejectionReason || undefined,
    moderationNote: payload.moderationNote || undefined,
  };

  const result = await apiPatch(path, body);
  const data = getEnvelopeData(result);
  return normalizeAdminReview(data?.review ?? data);
}

export async function deleteAdminReview(review) {
  const path = reviewActionPath(review, "delete") || buildDetailPath(endpoints.admin.reviews, review.id);
  return apiDelete(path);
}

export function getAdminReviewStatusOptions() {
  return [
    { value: "", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "published", label: "Published" },
    { value: "rejected", label: "Rejected" },
    { value: "hidden", label: "Hidden" },
  ];
}

export { normalizeAdminReview, normalizeReviewStatus };
