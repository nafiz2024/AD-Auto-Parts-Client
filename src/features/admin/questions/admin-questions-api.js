import { apiDelete, apiGet, apiPatch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import {
  buildDetailPath,
  firstBoolean,
  firstString,
  getEnvelopeData,
  normalizeItems,
  normalizePagination,
} from "@/features/feedback/feedback-utils";
import { normalizeQuestion, normalizeQuestionStatus } from "@/features/questions/question-api";

const DEFAULT_PAGE_SIZE = 10;

function questionActionPath(question, action) {
  if (action === "publish") {
    return firstString(question?.availableActions?.publishPath);
  }

  if (action === "reject") {
    return firstString(question?.availableActions?.rejectPath);
  }

  if (action === "hide") {
    return firstString(question?.availableActions?.hidePath);
  }

  if (action === "answer") {
    return firstString(question?.availableActions?.answerPath);
  }

  if (action === "delete") {
    return firstString(question?.availableActions?.deletePath);
  }

  return null;
}

function normalizeAdminQuestion(item, index = 0) {
  const question = normalizeQuestion(item, index);

  return {
    ...question,
    questionSummary: question.question.slice(0, 140),
    answerStatus: question.answer ? "answered" : "unanswered",
    supportsModerationNote:
      firstBoolean(item?.supportsModerationNote, item?.availableActions?.supportsModerationNote) ??
      false,
    supportsRejectionReason:
      firstBoolean(item?.supportsRejectionReason, item?.availableActions?.supportsRejectionReason) ??
      true,
    supportsPublicAnswerToggle:
      firstBoolean(
        item?.supportsPublicAnswerToggle,
        item?.availableActions?.supportsPublicAnswerToggle,
      ) ?? true,
  };
}

function normalizeCapabilities(payload) {
  const capabilities = payload?.capabilities ?? payload?.meta?.capabilities ?? {};

  return {
    canDelete:
      firstBoolean(capabilities?.canDelete, payload?.canDeleteQuestion) ?? false,
    canModerate:
      firstBoolean(capabilities?.canModerate, payload?.canModerateQuestion) ?? true,
    canAnswer:
      firstBoolean(capabilities?.canAnswer, payload?.canAnswerQuestion) ?? true,
  };
}

function normalizeAdminCollection(result, fallbackPage = 1, fallbackPageSize = DEFAULT_PAGE_SIZE) {
  const payload = getEnvelopeData(result);
  const items = normalizeItems(payload).map(normalizeAdminQuestion);

  return {
    items,
    pagination: normalizePagination(payload?.meta ?? result?.meta, fallbackPage, fallbackPageSize),
    capabilities: normalizeCapabilities(payload),
  };
}

export async function getAdminQuestions(filters = {}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? DEFAULT_PAGE_SIZE;
  const result = await apiGet(endpoints.admin.questions, {
    query: {
      page,
      limit,
      q: filters.q || undefined,
      status: filters.status || undefined,
      product: filters.product || undefined,
      answered: filters.answered || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    },
  });

  return normalizeAdminCollection(result, page, limit);
}

export async function getAdminQuestionDetail(questionId) {
  const result = await apiGet(buildDetailPath(endpoints.admin.questions, questionId));
  const payload = getEnvelopeData(result);
  return normalizeAdminQuestion(payload?.question ?? payload);
}

export async function moderateAdminQuestion(question, action, payload = {}) {
  const path = questionActionPath(question, action) || buildDetailPath(endpoints.admin.questions, question.id);
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
  return normalizeAdminQuestion(data?.question ?? data);
}

export async function answerAdminQuestion(question, payload) {
  const path =
    questionActionPath(question, "answer") || buildDetailPath(endpoints.admin.questions, question.id);
  const result = await apiPatch(path, {
    answer: payload.answer,
    publicVisible:
      typeof payload.publicVisible === "boolean" ? payload.publicVisible : undefined,
    moderationNote: payload.moderationNote || undefined,
  });
  const data = getEnvelopeData(result);
  return normalizeAdminQuestion(data?.question ?? data);
}

export async function deleteAdminQuestion(question) {
  const path = questionActionPath(question, "delete") || buildDetailPath(endpoints.admin.questions, question.id);
  return apiDelete(path);
}

export function getAdminQuestionStatusOptions() {
  return [
    { value: "", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "published", label: "Published" },
    { value: "answered", label: "Answered" },
    { value: "rejected", label: "Rejected" },
    { value: "hidden", label: "Hidden" },
  ];
}

export { normalizeAdminQuestion, normalizeQuestionStatus };
