import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import {
  asArray,
  buildDetailPath,
  firstBoolean,
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

function isPublicQuestion(question) {
  return (
    question.availableActions.publicVisible ||
    question.status === "published" ||
    question.status === "answered"
  );
}

function normalizeQuestionStatus(value) {
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

  if (normalized.includes("answer")) {
    return "answered";
  }

  return "pending";
}

function normalizeQuestion(item, index = 0) {
  const status = normalizeQuestionStatus(item?.status ?? item?.moderationStatus);
  const actions = item?.availableActions ?? item?.actions ?? {};
  const productId = firstString(item?.productId, item?.product?.id, item?.product?._id);
  const productSlug = firstString(item?.productSlug, item?.product?.slug, productId);

  return {
    id:
      firstString(item?.id, item?._id, item?.questionNumber, `question-${index}`) ??
      `question-${index}`,
    questionNumber:
      firstString(item?.questionNumber, item?.referenceNumber, item?.id) ??
      `QST-${index + 1}`,
    productId,
    productSlug,
    productName:
      firstString(item?.productName, item?.product?.name) ?? "Used auto part",
    productImageUrl: sanitizeDisplayUrl(
      item?.productImageUrl ??
        item?.product?.imageUrl ??
        item?.product?.primaryImageUrl ??
        item?.product?.thumbnailUrl,
    ),
    customerName:
      firstString(item?.customerDisplayName, item?.customer?.name, item?.author?.name) ??
      "Customer",
    question:
      firstString(item?.question, item?.message, item?.body, item?.content) ?? "",
    answer: firstString(item?.answer, item?.reply, item?.response),
    vehicleContext:
      firstString(item?.vehicleContext, item?.compatibilityContext, item?.vehicleInfo) ?? "",
    status,
    statusLabel:
      firstString(item?.statusLabel, item?.moderationStatusLabel, item?.status) ?? "Pending",
    answeredAt: normalizeDate(item?.answeredAt ?? item?.repliedAt),
    createdAt: normalizeDate(item?.createdAt ?? item?.submittedAt),
    updatedAt: normalizeDate(item?.updatedAt ?? item?.answeredAt ?? item?.createdAt),
    moderationNote: firstString(item?.moderationNote, item?.internalNote),
    rejectionReason: firstString(item?.rejectionReason, item?.publicReason),
    availableActions: {
      canEdit:
        firstBoolean(item?.canEdit, actions?.canEdit, actions?.edit) ?? false,
      canDelete:
        firstBoolean(item?.canDelete, actions?.canDelete, actions?.delete) ?? false,
      canPublish:
        firstBoolean(item?.canPublish, actions?.canPublish, actions?.approve) ?? false,
      canReject:
        firstBoolean(item?.canReject, actions?.canReject, actions?.reject) ?? false,
      canHide:
        firstBoolean(item?.canHide, actions?.canHide, actions?.hide) ?? false,
      canAnswer:
        firstBoolean(item?.canAnswer, actions?.canAnswer, actions?.reply) ?? false,
      canUpdateAnswer:
        firstBoolean(item?.canUpdateAnswer, actions?.canUpdateAnswer) ?? false,
      requiresAuthToSubmit:
        firstBoolean(item?.requiresAuthToSubmit, actions?.requiresAuthToSubmit) ?? false,
      publicVisible:
        firstBoolean(item?.publicVisible, item?.isPublic, item?.published) ??
        status === "published",
      answerPath: firstString(actions?.answerPath),
      publishPath: firstString(actions?.publishPath, actions?.approvePath),
      rejectPath: firstString(actions?.rejectPath),
      hidePath: firstString(actions?.hidePath),
      deletePath: firstString(actions?.deletePath),
    },
    history: uniqueBy(
      asArray(item?.history ?? item?.moderationHistory).map((entry, entryIndex) => ({
        id:
          firstString(entry?.id, entry?._id, `history-${entryIndex}`) ??
          `history-${entryIndex}`,
        status:
          firstString(entry?.statusLabel, entry?.status, entry?.action) ?? "Updated",
        note: firstString(entry?.note, entry?.message, entry?.reason),
        createdAt: normalizeDate(entry?.createdAt ?? entry?.updatedAt),
        author: firstString(entry?.author?.name, entry?.createdBy?.name),
      })),
      (entry) => entry.id,
    ),
  };
}

function normalizeQuestionCollection(result, fallbackPage = 1, fallbackPageSize = DEFAULT_PAGE_SIZE) {
  const payload = getEnvelopeData(result);
  const items = normalizeItems(payload).map(normalizeQuestion);
  const capabilities = payload?.capabilities ?? payload?.meta?.capabilities ?? {};

  return {
    items,
    pagination: normalizePagination(payload?.meta ?? result?.meta, fallbackPage, fallbackPageSize),
    capabilities: {
      canSubmit:
        firstBoolean(capabilities?.canSubmit, payload?.canSubmitQuestion) ?? true,
      requiresAuthToSubmit:
        firstBoolean(capabilities?.requiresAuthToSubmit, payload?.requiresAuth) ?? false,
      supportsVehicleContext:
        firstBoolean(capabilities?.supportsVehicleContext, payload?.supportsVehicleContext) ?? true,
    },
  };
}

function normalizePublicQuestionCollection(
  result,
  fallbackPage = 1,
  fallbackPageSize = DEFAULT_PAGE_SIZE,
) {
  const collection = normalizeQuestionCollection(result, fallbackPage, fallbackPageSize);

  return {
    ...collection,
    items: collection.items.filter(isPublicQuestion),
  };
}

export async function getPublicProductQuestions(productId, options = {}) {
  const page = options.page ?? 1;
  const limit = options.limit ?? DEFAULT_PAGE_SIZE;
  const result = await apiGet(endpoints.public.productQuestions, {
    query: {
      productId,
      page,
      limit,
    },
  });

  return normalizePublicQuestionCollection(result, page, limit);
}

export async function getCustomerQuestions(options = {}) {
  const page = options.page ?? 1;
  const limit = options.limit ?? DEFAULT_PAGE_SIZE;
  const result = await apiGet(endpoints.account.questions, {
    ...ACCOUNT_REQUEST_OPTIONS,
    query: {
      page,
      limit,
      status: options.status || undefined,
      q: options.q || undefined,
    },
  });

  return normalizeQuestionCollection(result, page, limit);
}

export async function createCustomerQuestion(payload) {
  const result = await apiPost(endpoints.customer.productQuestions, payload);
  const data = getEnvelopeData(result);
  return normalizeQuestion(data?.question ?? data);
}

export async function updateCustomerQuestion(questionId, payload) {
  const result = await apiPatch(
    buildDetailPath(endpoints.customer.productQuestions, questionId),
    payload,
  );
  const data = getEnvelopeData(result);
  return normalizeQuestion(data?.question ?? data);
}

export async function deleteCustomerQuestion(questionId) {
  return apiDelete(buildDetailPath(endpoints.customer.productQuestions, questionId));
}

export { normalizeQuestion, normalizeQuestionStatus };
