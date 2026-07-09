"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileTextIcon, XIcon } from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import { getAdminAccessState } from "@/features/admin/admin-access";
import {
  deleteAdminReview,
  getAdminReviewDetail,
  getAdminReviews,
  getAdminReviewStatusOptions,
  moderateAdminReview,
} from "@/features/admin/reviews/admin-reviews-api";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

function formatDate(value, locale) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getBadgeVariant(status) {
  if (status === "published") {
    return "success";
  }

  if (status === "rejected" || status === "hidden") {
    return "error";
  }

  return "warning";
}

function ReviewDetailPanel({ reviewId, onClose, onUpdated }) {
  const { t, locale } = useLanguage();
  const toast = useToast();
  const [state, setState] = useState({
    loading: true,
    error: null,
    review: null,
  });
  const [dialog, setDialog] = useState({
    open: false,
    action: "publish",
    reason: "",
    note: "",
  });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!reviewId) {
      return undefined;
    }

    let active = true;

    async function load() {
      setState({
        loading: true,
        error: null,
        review: null,
      });

      try {
        const review = await getAdminReviewDetail(reviewId);

        if (active) {
          setState({
            loading: false,
            error: null,
            review,
          });
        }
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            error,
            review: null,
          });
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [reviewId]);

  async function runAction(action) {
    if (!state.review) {
      return;
    }

    startTransition(async () => {
      try {
        const nextReview =
          action === "delete"
            ? await deleteAdminReview(state.review).then(() => null)
            : await moderateAdminReview(state.review, action, {
                rejectionReason: dialog.reason,
                moderationNote: dialog.note,
              });
        setDialog({
          open: false,
          action: "publish",
          reason: "",
          note: "",
        });
        if (nextReview) {
          setState({
            loading: false,
            error: null,
            review: nextReview,
          });
        }
        onUpdated?.(action, nextReview ?? state.review);
        toast.success(
          t(action === "publish" ? "published" : action === "reject" ? "rejected" : action === "hide" ? "hidden" : "productDeleted"),
          t("moderationUpdatedDescription"),
        );
        if (action === "delete") {
          onClose?.();
        }
      } catch (error) {
        toast.apiError(error, t("moderation"));
      }
    });
  }

  if (!reviewId) {
    return null;
  }

  const review = state.review;

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end bg-brand-navy/35 backdrop-blur-sm">
        <button type="button" className="hidden flex-1 lg:block" onClick={onClose} />
        <aside className="flex h-full w-full max-w-[34rem] flex-col overflow-y-auto bg-white shadow-2xl">
          <div className="sticky top-0 z-10 border-b border-border bg-white/95 px-5 py-4 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("moderation")}</p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">{t("reviews")}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label={t("closePanel")}
              >
                <XIcon className="size-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-5 px-5 py-5">
            {state.loading ? (
              <Card className="space-y-4 rounded-[1.75rem]">
                <div className="h-6 w-40 animate-pulse rounded-full bg-muted" />
                <div className="h-24 animate-pulse rounded-[1.5rem] bg-muted" />
                <div className="h-32 animate-pulse rounded-[1.5rem] bg-muted" />
              </Card>
            ) : null}

            {state.error ? (
              <Alert variant="warning" title={t("failedToLoad")}>
                {t("adminReviewsLoadError")}
              </Alert>
            ) : null}

            {review ? (
              <>
                <Card className="space-y-4 rounded-[1.75rem]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-foreground">{review.productName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{review.customerName}</p>
                    </div>
                    <Badge variant={getBadgeVariant(review.status)}>{t(review.status)}</Badge>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("rating")}</p>
                      <p className="mt-1 font-medium text-foreground">{review.rating ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("createdDate")}</p>
                      <p className="mt-1 font-medium text-foreground">{formatDate(review.createdAt, locale)}</p>
                    </div>
                  </div>
                </Card>

                <Card className="space-y-4 rounded-[1.75rem]">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("reviewTitle")}</p>
                    <p className="mt-1 font-medium text-foreground">{review.title || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("reviewComment")}</p>
                    <p className="mt-1 text-sm leading-7 text-muted-foreground">{review.comment || "-"}</p>
                  </div>
                  {review.rejectionReason ? (
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("rejectionReason")}</p>
                      <p className="mt-1 text-sm text-foreground">{review.rejectionReason}</p>
                    </div>
                  ) : null}
                  {review.supportsModerationNote && review.moderationNote ? (
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("moderationNote")}</p>
                      <p className="mt-1 text-sm text-foreground">{review.moderationNote}</p>
                    </div>
                  ) : null}
                </Card>

                {review.moderationHistory?.length ? (
                  <Card className="space-y-4 rounded-[1.75rem]">
                    <h3 className="text-lg font-semibold text-foreground">{t("changeHistory")}</h3>
                    {review.moderationHistory.map((entry) => (
                      <div key={entry.id} className="rounded-[1.25rem] border border-border/70 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-medium text-foreground">{entry.status}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(entry.createdAt, locale)}</p>
                        </div>
                        {entry.note ? (
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.note}</p>
                        ) : null}
                      </div>
                    ))}
                  </Card>
                ) : null}
              </>
            ) : null}
          </div>

          {review ? (
            <div className="sticky bottom-0 border-t border-border bg-white px-5 py-4">
              <div className="flex flex-wrap gap-3">
                {review.availableActions.canPublish ? (
                  <Button onClick={() => setDialog({ open: true, action: "publish", reason: "", note: "" })}>
                    {t("publish")}
                  </Button>
                ) : null}
                {review.availableActions.canReject ? (
                  <Button
                    variant="warning"
                    onClick={() => setDialog({ open: true, action: "reject", reason: "", note: "" })}
                  >
                    {t("reject")}
                  </Button>
                ) : null}
                {review.availableActions.canHide ? (
                  <Button
                    variant="outline"
                    onClick={() => setDialog({ open: true, action: "hide", reason: "", note: "" })}
                  >
                    {t("hide")}
                  </Button>
                ) : null}
                {review.availableActions.canDelete ? (
                  <Button
                    variant="danger"
                    onClick={() => setDialog({ open: true, action: "delete", reason: "", note: "" })}
                  >
                    {t("deleteReview")}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      <ConfirmationDialog
        open={dialog.open}
        title={
          dialog.action === "publish"
            ? t("publish")
            : dialog.action === "reject"
              ? t("reject")
              : dialog.action === "hide"
                ? t("hide")
                : t("deleteReview")
        }
        description={t("moderationConfirmation")}
        confirmLabel={isPending ? t("saving") : t(dialog.action === "delete" ? "deleteReview" : dialog.action)}
        cancelLabel={t("cancel")}
        onConfirm={() => runAction(dialog.action)}
        onCancel={() => setDialog({ open: false, action: "publish", reason: "", note: "" })}
        tone={dialog.action === "delete" ? "destructive" : dialog.action === "reject" ? "warning" : "info"}
        reasonLabel={dialog.action === "reject" ? t("rejectionReason") : review?.supportsModerationNote ? t("moderationNote") : undefined}
        reasonPlaceholder={dialog.action === "reject" ? t("enterRejectionReason") : t("internalNotePlaceholder")}
        reasonValue={dialog.action === "reject" ? dialog.reason : dialog.note}
        onReasonChange={(value) =>
          setDialog((current) =>
            current.action === "reject"
              ? { ...current, reason: value }
              : { ...current, note: value },
          )
        }
      />
    </>
  );
}

function ReviewsTable({ items, t, locale, onOpen }) {
  return (
    <div className="hidden overflow-x-auto xl:block">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="pb-3">{t("product")}</th>
            <th className="pb-3">{t("customer")}</th>
            <th className="pb-3">{t("rating")}</th>
            <th className="pb-3">{t("reviewTitle")}</th>
            <th className="pb-3">{t("status")}</th>
            <th className="pb-3">{t("date")}</th>
            <th className="pb-3">{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((review) => (
            <tr key={review.id} className="border-b border-border/70 align-top last:border-b-0">
              <td className="py-4">
                <p className="font-semibold text-foreground">{review.productName}</p>
              </td>
              <td className="py-4 text-muted-foreground">{review.customerName}</td>
              <td className="py-4 text-muted-foreground">{review.rating ?? "-"}</td>
              <td className="py-4 text-muted-foreground">{review.reviewSummary}</td>
              <td className="py-4">
                <Badge variant={getBadgeVariant(review.status)}>{t(review.status)}</Badge>
              </td>
              <td className="py-4 text-muted-foreground">{formatDate(review.createdAt, locale)}</td>
              <td className="py-4">
                <Button size="sm" variant="outline" onClick={() => onOpen(review.id)}>
                  {t("viewDetails")}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReviewsCards({ items, t, locale, onOpen }) {
  return (
    <div className="grid gap-4 xl:hidden">
      {items.map((review) => (
        <Card key={review.id} className="space-y-4 rounded-[1.75rem]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-foreground">{review.productName}</p>
              <p className="mt-1 text-sm text-muted-foreground">{review.customerName}</p>
            </div>
            <Badge variant={getBadgeVariant(review.status)}>{t(review.status)}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("rating")}</p>
              <p className="mt-1 font-medium text-foreground">{review.rating ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("date")}</p>
              <p className="mt-1 font-medium text-foreground">{formatDate(review.createdAt, locale)}</p>
            </div>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{review.reviewSummary}</p>
          <Button onClick={() => onOpen(review.id)}>{t("viewDetails")}</Button>
        </Card>
      ))}
    </div>
  );
}

export function AdminReviewsPage() {
  const auth = useAuth();
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    rating: "",
    product: "",
    dateFrom: "",
    dateTo: "",
    page: 1,
  });
  const [state, setState] = useState({
    loading: true,
    error: null,
    items: [],
    pagination: null,
  });
  const [selectedReviewId, setSelectedReviewId] = useState("");

  useEffect(() => {
    if (auth.isLoading) {
      return undefined;
    }

    const access = getAdminAccessState(auth.session);

    if (!access.isAuthenticated) {
      router.replace(routes.admin.adminLogin);
      return undefined;
    }

    if (access.forbidden) {
      auth.logout().finally(() => router.replace(routes.admin.adminLogin));
      return undefined;
    }

    if (access.totpPending) {
      router.replace(routes.admin.adminTotp);
      return undefined;
    }

    let active = true;

    async function load() {
      setState((current) => ({ ...current, loading: true, error: null }));

      try {
        const result = await getAdminReviews(filters);

        if (active) {
          setState({
            loading: false,
            error: null,
            items: result.items,
            pagination: result.pagination,
          });
        }
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            error,
            items: [],
            pagination: null,
          });
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [auth, filters, router]);

  function updateList(nextReview) {
    setState((current) => ({
      ...current,
      items: nextReview
        ? current.items.map((item) => (item.id === nextReview.id ? nextReview : item))
        : current.items.filter((item) => item.id !== selectedReviewId),
    }));
  }

  const statusOptions = getAdminReviewStatusOptions();

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title={t("reviews")}
          description={t("adminReviewsDescription")}
        />

        <Card className="space-y-5 rounded-[2rem]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <Input
              value={filters.q}
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value, page: 1 }))}
              placeholder={t("searchReviews")}
              className="xl:col-span-2"
            />
            <Select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}
            >
              {statusOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.value ? t(option.value) : t("allStatuses")}
                </option>
              ))}
            </Select>
            <Input
              value={filters.rating}
              onChange={(event) => setFilters((current) => ({ ...current, rating: event.target.value, page: 1 }))}
              placeholder={t("rating")}
            />
            <Input
              value={filters.product}
              onChange={(event) => setFilters((current) => ({ ...current, product: event.target.value, page: 1 }))}
              placeholder={t("product")}
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:col-span-6">
              <div className="space-y-2">
                <Label htmlFor="reviews-date-from">{t("dateFrom")}</Label>
                <Input
                  id="reviews-date-from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value, page: 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reviews-date-to">{t("dateTo")}</Label>
                <Input
                  id="reviews-date-to"
                  type="date"
                  value={filters.dateTo}
                  onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value, page: 1 }))}
                />
              </div>
            </div>
          </div>

          {state.loading ? (
            <Card className="space-y-4 rounded-[1.75rem]">
              <div className="h-6 w-48 animate-pulse rounded-full bg-muted" />
              <div className="h-24 animate-pulse rounded-[1.5rem] bg-muted" />
              <div className="h-24 animate-pulse rounded-[1.5rem] bg-muted" />
            </Card>
          ) : null}

          {state.error ? (
            <Alert variant="warning" title={t("failedToLoad")}>
              {t("adminReviewsLoadError")}
            </Alert>
          ) : null}

          {!state.loading && !state.error && state.items.length === 0 ? (
            <EmptyState
              icon={FileTextIcon}
              title={t("reviews")}
              description={t("adminReviewsEmptyDescription")}
            />
          ) : null}

          {!state.loading && state.items.length > 0 ? (
            <>
              <ReviewsTable items={state.items} t={t} locale={locale} onOpen={setSelectedReviewId} />
              <ReviewsCards items={state.items} t={t} locale={locale} onOpen={setSelectedReviewId} />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm text-muted-foreground">
                <p>
                  {t("showingPageOf", {
                    page: state.pagination?.currentPage ?? 1,
                    totalPages: state.pagination?.totalPages ?? 1,
                  })}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(state.pagination?.currentPage ?? 1) <= 1}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        page: Math.max((state.pagination?.currentPage ?? 1) - 1, 1),
                      }))
                    }
                  >
                    {t("previous")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(state.pagination?.currentPage ?? 1) >= (state.pagination?.totalPages ?? 1)}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        page: (state.pagination?.currentPage ?? 1) + 1,
                      }))
                    }
                  >
                    {t("next")}
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </Card>
      </div>

      <ReviewDetailPanel
        reviewId={selectedReviewId}
        onClose={() => setSelectedReviewId("")}
        onUpdated={(_action, nextReview) => updateList(nextReview)}
      />
    </>
  );
}
