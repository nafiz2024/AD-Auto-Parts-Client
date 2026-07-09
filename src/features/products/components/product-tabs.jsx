"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { routes } from "@/constants/routes";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { buildCustomerLoginHref } from "@/lib/auth/customer-auth";
import { getPublicProductQuestions, createCustomerQuestion } from "@/features/questions/question-api";
import { getPublicProductReviews, createCustomerReview } from "@/features/reviews/review-api";

function StarIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2.75 14.9 8.63l6.48.94-4.69 4.58 1.11 6.46L12 17.56l-5.8 3.05 1.11-6.46-4.69-4.58 6.48-.94Z" />
    </svg>
  );
}

function RatingStars({ rating = 0, className = "size-4" }) {
  const roundedRating = Math.round(rating || 0);

  return (
    <div className="flex items-center gap-1 text-amber-400">
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon
          key={index}
          className={`${className} ${index < roundedRating ? "opacity-100" : "opacity-20"}`}
        />
      ))}
    </div>
  );
}

function RatingInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }).map((_, index) => {
        const rating = index + 1;

        return (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className="text-amber-400 transition hover:scale-105"
            aria-label={`Rate ${rating}`}
          >
            <StarIcon className={`size-7 ${value >= rating ? "opacity-100" : "opacity-20"}`} />
          </button>
        );
      })}
    </div>
  );
}

function formatDate(value, locale) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SpecsTable({ specifications }) {
  const { t } = useLanguage();

  if (!specifications.length) {
    return (
      <EmptyState
        title={t("specificationsComingSoon")}
        description={t("specificationsComingSoonDescription")}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border/70">
      <div className="divide-y divide-border/70">
        {specifications.map((specification) => (
          <div
            key={specification.label}
            className="grid gap-2 bg-white px-5 py-4 sm:grid-cols-[200px_minmax(0,1fr)]"
          >
            <p className="text-sm font-semibold text-foreground">{specification.label}</p>
            <p className="text-sm text-muted-foreground">{specification.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompatibilityTable({ compatibility }) {
  const { t } = useLanguage();

  if (!compatibility.entries.length) {
    return (
      <EmptyState
        title={t("compatibilityDetailsUnavailable")}
        description={t("compatibilityDetailsUnavailableDescription")}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-[1.75rem] border border-border/70">
      <table className="min-w-full text-start">
        <thead className="bg-muted/50 text-sm text-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">{t("brand")}</th>
            <th className="px-4 py-3 font-semibold">{t("carModel")}</th>
            <th className="px-4 py-3 font-semibold">{t("manufacturingYear")}</th>
            <th className="px-4 py-3 font-semibold">{t("engine")}</th>
            <th className="px-4 py-3 font-semibold">{t("engineCode")}</th>
            <th className="px-4 py-3 font-semibold">{t("partPosition")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70 bg-white text-sm text-muted-foreground">
          {compatibility.entries.map((entry) => (
            <tr key={entry.id}>
              <td className="px-4 py-3">{entry.vehicleBrand || "-"}</td>
              <td className="px-4 py-3">{entry.model || "-"}</td>
              <td className="px-4 py-3">{entry.yearRange || "-"}</td>
              <td className="px-4 py-3">{entry.engine || "-"}</td>
              <td className="px-4 py-3">{entry.engineCode || "-"}</td>
              <td className="px-4 py-3">{entry.position || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeliveryAndReturn({ deliveryNotes, returnNotes }) {
  const { t } = useLanguage();
  const hasDelivery = deliveryNotes.length > 0;
  const hasReturn = returnNotes.length > 0;

  if (!hasDelivery && !hasReturn) {
    return (
      <EmptyState
        title={t("deliveryAndReturnComingSoon")}
        description={t("deliveryAndReturnComingSoonDescription")}
      />
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="rounded-[1.75rem]">
        <h3 className="text-lg font-semibold text-foreground">{t("deliveryInformation")}</h3>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
          {hasDelivery ? (
            deliveryNotes.map((note) => <li key={note.id}>- {note.note}</li>)
          ) : (
            <li>- {t("deliveryTimingConfirmedAtCheckout")}</li>
          )}
        </ul>
      </Card>
      <Card className="rounded-[1.75rem]">
        <h3 className="text-lg font-semibold text-foreground">{t("returnAndWarranty")}</h3>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
          {hasReturn ? (
            returnNotes.map((note) => <li key={note.id}>- {note.note}</li>)
          ) : (
            <li>- {t("returnWarrantyNotesWillAppear")}</li>
          )}
        </ul>
      </Card>
    </div>
  );
}

function ReviewComposer({ productId, onCreated, supportsTitle }) {
  const auth = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState({
    rating: 0,
    title: "",
    comment: "",
  });

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!auth.isAuthenticated) {
      return;
    }

    startTransition(async () => {
      try {
        const created = await createCustomerReview({
          productId,
          rating: form.rating,
          title: supportsTitle ? form.title || undefined : undefined,
          comment: form.comment,
        });
        setFieldErrors({});
        setSuccessMessage(t("yourReviewIsPendingModeration"));
        setForm({
          rating: 0,
          title: "",
          comment: "",
        });
        onCreated?.(created);
        toast.success(t("reviewSubmittedSuccessfully"), t("yourReviewIsPendingModeration"));
      } catch (error) {
        setFieldErrors(error?.fieldErrors ?? {});
        toast.apiError(error, t("submitReview"));
      }
    });
  }

  return (
    <Card className="rounded-[1.75rem]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-foreground">{t("writeAReview")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("reviewFormDescription")}</p>
        </div>
      </div>
      {!auth.isAuthenticated ? (
        <Alert className="mt-5" variant="info" title={t("accountAccessRequired")}>
          <div className="space-y-3">
            <p>{t("reviewSignInRequiredDescription")}</p>
            <Link href={buildCustomerLoginHref(routes.public.productDetail(productId))}>
              <Button size="sm" variant="outline">{t("signInToContinue")}</Button>
            </Link>
          </div>
        </Alert>
      ) : null}
      {successMessage ? (
        <Alert className="mt-5" variant="success" title={t("reviewSubmittedSuccessfully")}>
          {successMessage}
        </Alert>
      ) : null}
      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label>{t("rating")}</Label>
          <RatingInput value={form.rating} onChange={(value) => updateField("rating", value)} />
          {fieldErrors.rating ? <p className="text-sm text-error">{fieldErrors.rating}</p> : null}
        </div>
        {supportsTitle ? (
          <div className="space-y-2">
            <Label htmlFor="review-title">{t("reviewTitle")}</Label>
            <Input
              id="review-title"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder={t("reviewTitlePlaceholder")}
            />
            {fieldErrors.title ? <p className="text-sm text-error">{fieldErrors.title}</p> : null}
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="review-comment">{t("reviewComment")}</Label>
          <Textarea
            id="review-comment"
            className="min-h-28"
            value={form.comment}
            onChange={(event) => updateField("comment", event.target.value)}
            placeholder={t("reviewCommentPlaceholder")}
          />
          {fieldErrors.comment ? <p className="text-sm text-error">{fieldErrors.comment}</p> : null}
        </div>
        <Button type="submit" disabled={isPending || !auth.isAuthenticated || !form.rating || !form.comment.trim()}>
          {isPending ? t("sending") : t("submitReview")}
        </Button>
      </form>
    </Card>
  );
}

function ReviewsPanel({ productId, initialReviews }) {
  const { t, locale } = useLanguage();
  const [reviews, setReviews] = useState(initialReviews);
  const [loadingMore, startLoadMore] = useTransition();
  const canLoadMore = reviews.pagination.currentPage < reviews.pagination.totalPages;

  function handleCreated(created) {
    setReviews((current) => {
      if (!created.availableActions.publicVisible) {
        return current;
      }

      const nextItems = [created, ...current.items];
      return {
        ...current,
        items: nextItems,
        averageRating: current.averageRating,
        reviewCount: current.reviewCount + 1,
        summary: {
          ...current.summary,
          reviewCount: (current.summary?.reviewCount ?? current.reviewCount) + 1,
        },
      };
    });
  }

  function loadMore() {
    startLoadMore(async () => {
      const nextPage = reviews.pagination.currentPage + 1;

      try {
        const nextReviews = await getPublicProductReviews(productId, {
          page: nextPage,
          limit: reviews.pagination.pageSize,
        });
        setReviews((current) => ({
          ...current,
          items: [...current.items, ...nextReviews.items],
          pagination: nextReviews.pagination,
          summary: nextReviews.summary,
          averageRating: nextReviews.summary.averageRating,
          reviewCount: nextReviews.summary.reviewCount,
          ratingBreakdown: nextReviews.summary.ratingBreakdown,
          capabilities: nextReviews.capabilities,
          source: "api",
          error: null,
        }));
      } catch (error) {
        setReviews((current) => ({
          ...current,
          error,
        }));
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-[1.75rem]">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <p className="text-5xl font-semibold tracking-tight text-foreground">
                {reviews.averageRating?.toFixed?.(1) ?? "-"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("reviewsCount", {
                  count: reviews.reviewCount ?? 0,
                  suffix: (reviews.reviewCount ?? 0) === 1 ? "" : "s",
                })}
              </p>
            </div>
            <div className="space-y-2">
              <RatingStars rating={reviews.averageRating} className="size-5" />
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {t("productReviews")}
              </p>
            </div>
          </div>
          {reviews.ratingBreakdown?.length ? (
            <div className="mt-6 space-y-3">
              {reviews.ratingBreakdown.map((entry) => {
                const total = reviews.reviewCount || 1;
                const width = `${Math.min((entry.count / total) * 100, 100)}%`;

                return (
                  <div key={entry.rating} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-sm">
                    <span className="font-medium text-foreground">{entry.rating}</span>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-brand-red" style={{ width }} />
                    </div>
                    <span className="text-muted-foreground">{entry.count}</span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </Card>
        <ReviewComposer
          productId={productId}
          supportsTitle={reviews.capabilities?.supportsTitle !== false}
          onCreated={handleCreated}
        />
      </div>

      {reviews.error ? (
        <Alert variant="warning" title={t("failedToLoad")}>
          {t("productReviewsLoadError")}
        </Alert>
      ) : null}

      {reviews.items.length === 0 ? (
        <EmptyState
          title={t("noReviewsYet")}
          description={t("productReviewsEmptyDescription")}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {reviews.items.map((review) => (
              <Card key={review.id} className="rounded-[1.75rem]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{review.reviewerName}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {review.verifiedBuyer ? (
                        <span className="rounded-full bg-success/10 px-3 py-1 font-semibold uppercase tracking-[0.16em] text-success">
                          {t("verifiedBuyer")}
                        </span>
                      ) : null}
                      {review.createdAt ? <span>{formatDate(review.createdAt, locale)}</span> : null}
                    </div>
                  </div>
                  <RatingStars rating={review.rating} />
                </div>
                {review.title ? (
                  <p className="mt-4 text-sm font-semibold text-foreground">{review.title}</p>
                ) : null}
                {review.comment ? (
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{review.comment}</p>
                ) : null}
              </Card>
            ))}
          </div>
          {canLoadMore ? (
            <div className="flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? t("loading") : t("loadMoreReviews")}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function QuestionComposer({ productId, supportsVehicleContext, requiresAuth, onCreated }) {
  const auth = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState({
    question: "",
    vehicleContext: "",
  });
  const signInRequired = requiresAuth && !auth.isAuthenticated;

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (signInRequired) {
      return;
    }

    startTransition(async () => {
      try {
        const created = await createCustomerQuestion({
          productId,
          question: form.question,
          vehicleContext:
            supportsVehicleContext && form.vehicleContext.trim()
              ? form.vehicleContext
              : undefined,
        });
        setFieldErrors({});
        setSuccessMessage(t("yourQuestionIsPendingModeration"));
        setForm({
          question: "",
          vehicleContext: "",
        });
        onCreated?.(created);
        toast.success(t("questionSubmittedSuccessfully"), t("yourQuestionIsPendingModeration"));
      } catch (error) {
        setFieldErrors(error?.fieldErrors ?? {});
        toast.apiError(error, t("submitQuestion"));
      }
    });
  }

  return (
    <Card className="rounded-[1.75rem]">
      <h3 className="text-xl font-semibold text-foreground">{t("askAQuestion")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t("productQuestionsDescription")}</p>
      {signInRequired ? (
        <Alert className="mt-5" variant="info" title={t("accountAccessRequired")}>
          <div className="space-y-3">
            <p>{t("questionSignInRequiredDescription")}</p>
            <Link href={buildCustomerLoginHref(routes.public.productDetail(productId))}>
              <Button size="sm" variant="outline">{t("signInToContinue")}</Button>
            </Link>
          </div>
        </Alert>
      ) : null}
      {successMessage ? (
        <Alert className="mt-5" variant="success" title={t("questionSubmittedSuccessfully")}>
          {successMessage}
        </Alert>
      ) : null}
      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="product-question">{t("question")}</Label>
          <Textarea
            id="product-question"
            className="min-h-28"
            value={form.question}
            onChange={(event) => updateField("question", event.target.value)}
            placeholder={t("questionPlaceholder")}
          />
          {fieldErrors.question ? <p className="text-sm text-error">{fieldErrors.question}</p> : null}
        </div>
        {supportsVehicleContext ? (
          <div className="space-y-2">
            <Label htmlFor="product-vehicle-context">{t("vehicleCompatibilityContext")}</Label>
            <Textarea
              id="product-vehicle-context"
              value={form.vehicleContext}
              onChange={(event) => updateField("vehicleContext", event.target.value)}
              placeholder={t("vehicleCompatibilityContextPlaceholder")}
            />
            {fieldErrors.vehicleContext ? (
              <p className="text-sm text-error">{fieldErrors.vehicleContext}</p>
            ) : null}
          </div>
        ) : null}
        <Button type="submit" disabled={isPending || signInRequired || !form.question.trim()}>
          {isPending ? t("sending") : t("submitQuestion")}
        </Button>
      </form>
    </Card>
  );
}

function QuestionsPanel({ productId, initialQuestions }) {
  const { t, locale } = useLanguage();
  const [questions, setQuestions] = useState(initialQuestions);
  const [loadingMore, startLoadMore] = useTransition();
  const canLoadMore = questions.pagination.currentPage < questions.pagination.totalPages;

  function handleCreated(created) {
    setQuestions((current) => {
      if (!created.availableActions.publicVisible) {
        return current;
      }

      return {
        ...current,
        items: [created, ...current.items],
      };
    });
  }

  function loadMore() {
    startLoadMore(async () => {
      const nextPage = questions.pagination.currentPage + 1;

      try {
        const nextQuestions = await getPublicProductQuestions(productId, {
          page: nextPage,
          limit: questions.pagination.pageSize,
        });
        setQuestions((current) => ({
          ...current,
          items: [...current.items, ...nextQuestions.items],
          pagination: nextQuestions.pagination,
          capabilities: nextQuestions.capabilities,
          source: "api",
          error: null,
        }));
      } catch (error) {
        setQuestions((current) => ({
          ...current,
          error,
        }));
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-[1.75rem]">
          <h3 className="text-xl font-semibold text-foreground">{t("questionsAndAnswers")}</h3>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {t("publicQuestionsHelpText")}
          </p>
          <div className="mt-5 rounded-[1.25rem] border border-border/70 bg-muted/30 px-4 py-4">
            <p className="text-3xl font-semibold text-foreground">{questions.items.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("publicQuestionsShown")}</p>
          </div>
        </Card>
        <QuestionComposer
          productId={productId}
          supportsVehicleContext={questions.capabilities?.supportsVehicleContext !== false}
          requiresAuth={questions.capabilities?.requiresAuthToSubmit === true}
          onCreated={handleCreated}
        />
      </div>

      {questions.error ? (
        <Alert variant="warning" title={t("failedToLoad")}>
          {t("productQuestionsLoadError")}
        </Alert>
      ) : null}

      {questions.items.length === 0 ? (
        <EmptyState
          title={t("noQuestionsYet")}
          description={t("productQuestionsEmptyDescription")}
        />
      ) : (
        <div className="space-y-4">
          {questions.items.map((question) => (
            <Card key={question.id} className="rounded-[1.75rem]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{question.customerName}</p>
                  {question.createdAt ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(question.createdAt, locale)}
                    </p>
                  ) : null}
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-foreground">{question.question}</p>
              {question.vehicleContext ? (
                <p className="mt-3 rounded-[1rem] bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  {question.vehicleContext}
                </p>
              ) : null}
              {question.answer ? (
                <div className="mt-4 rounded-[1.25rem] border border-border/70 bg-muted/20 px-4 py-4">
                  <p className="text-sm font-semibold text-foreground">{t("answer")}</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{question.answer}</p>
                  {question.answeredAt ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {formatDate(question.answeredAt, locale)}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </Card>
          ))}
          {canLoadMore ? (
            <div className="flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? t("loading") : t("loadMoreQuestions")}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function ProductTabs({
  productId,
  description,
  productName,
  specifications,
  compatibility,
  deliveryNotes,
  returnNotes,
  reviews,
  questions,
}) {
  const { t } = useLanguage();
  const tabs = [
    { id: "description", label: t("description") },
    { id: "specifications", label: t("specifications") },
    { id: "compatibility", label: t("compatibility") },
    { id: "deliveryAndReturn", label: t("deliveryAndReturn") },
    { id: "reviews", label: t("reviews") },
    { id: "questions", label: t("questionsAndAnswers") },
  ];
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className="space-y-5">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "border-brand-red bg-brand-red text-white"
                : "border-border bg-white text-foreground hover:border-brand-red hover:text-brand-red"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "description" ? (
        <Card className="rounded-[2rem]">
          <h2 className="text-2xl font-semibold text-foreground">{t("description")}</h2>
          <p className="mt-4 text-sm leading-8 text-muted-foreground">
            {description || t("detailedProductDescriptionWillAppear")}
          </p>
          {productName ? (
            <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {productName}
            </p>
          ) : null}
        </Card>
      ) : null}

      {activeTab === "specifications" ? <SpecsTable specifications={specifications} /> : null}
      {activeTab === "compatibility" ? <CompatibilityTable compatibility={compatibility} /> : null}
      {activeTab === "deliveryAndReturn" ? (
        <DeliveryAndReturn deliveryNotes={deliveryNotes} returnNotes={returnNotes} />
      ) : null}
      {activeTab === "reviews" ? (
        <ReviewsPanel productId={productId} initialReviews={reviews} />
      ) : null}
      {activeTab === "questions" ? (
        <QuestionsPanel productId={productId} initialQuestions={questions} />
      ) : null}
    </div>
  );
}
