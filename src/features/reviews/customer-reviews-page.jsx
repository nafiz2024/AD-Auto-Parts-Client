"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileTextIcon } from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import {
  deleteCustomerReview,
  getCustomerReviews,
  updateCustomerReview,
} from "@/features/reviews/review-api";

function formatDate(value, locale) {
  if (!value) {
    return "-";
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

function getVariant(status) {
  if (status === "published") {
    return "success";
  }

  if (status === "rejected" || status === "hidden") {
    return "error";
  }

  return "warning";
}

function ReviewEditor({ review, onCancel, onSaved }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    rating: review.rating ?? 0,
    title: review.title ?? "",
    comment: review.comment ?? "",
  });

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    startTransition(async () => {
      try {
        const updated = await updateCustomerReview(review.id, {
          rating: form.rating,
          title: form.title || undefined,
          comment: form.comment,
        });
        setFieldErrors({});
        onSaved?.(updated);
        toast.success(t("productUpdatedSuccessfully"), t("reviewUpdatedDescription"));
      } catch (error) {
        setFieldErrors(error?.fieldErrors ?? {});
        toast.apiError(error, t("reviews"));
      }
    });
  }

  return (
    <Card className="space-y-4 rounded-[1.75rem] border-brand-red/20">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t("editReview")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{review.productName}</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="review-edit-rating">{t("rating")}</Label>
          <Input
            id="review-edit-rating"
            type="number"
            min="1"
            max="5"
            value={form.rating}
            onChange={(event) => updateField("rating", event.target.value)}
          />
          {fieldErrors.rating ? <p className="text-sm text-error">{fieldErrors.rating}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="review-edit-title">{t("reviewTitle")}</Label>
          <Input
            id="review-edit-title"
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
          />
          {fieldErrors.title ? <p className="text-sm text-error">{fieldErrors.title}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="review-edit-comment">{t("reviewComment")}</Label>
          <Textarea
            id="review-edit-comment"
            className="min-h-28"
            value={form.comment}
            onChange={(event) => updateField("comment", event.target.value)}
          />
          {fieldErrors.comment ? <p className="text-sm text-error">{fieldErrors.comment}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? t("saving") : t("saveChanges")}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function CustomerReviewsPage() {
  const { t, locale } = useLanguage();
  const toast = useToast();
  const [filters, setFilters] = useState({ status: "", q: "" });
  const [state, setState] = useState({
    loading: true,
    error: null,
    items: [],
  });
  const [editingReview, setEditingReview] = useState(null);
  const [deletingReview, setDeletingReview] = useState(null);
  const [isDeleting, startDelete] = useTransition();

  useEffect(() => {
    let active = true;

    async function load() {
      setState((current) => ({ ...current, loading: true, error: null }));

      try {
        const result = await getCustomerReviews(filters);

        if (active) {
          setState({
            loading: false,
            error: null,
            items: result.items,
          });
        }
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            error,
            items: [],
          });
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [filters]);

  function handleDelete() {
    if (!deletingReview) {
      return;
    }

    startDelete(async () => {
      try {
        await deleteCustomerReview(deletingReview.id);
        setState((current) => ({
          ...current,
          items: current.items.filter((item) => item.id !== deletingReview.id),
        }));
        setDeletingReview(null);
        toast.success(t("productDeleted"), t("reviewDeletedDescription"));
      } catch (error) {
        toast.apiError(error, t("reviews"));
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{t("customerReviews")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("customerReviewsDescription")}</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <Input
            value={filters.q}
            onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
            placeholder={t("searchReviews")}
          />
          <Select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="">{t("allStatuses")}</option>
            <option value="pending">{t("pendingReview")}</option>
            <option value="published">{t("published")}</option>
            <option value="rejected">{t("rejected")}</option>
            <option value="hidden">{t("hidden")}</option>
          </Select>
        </div>
      </Card>

      {editingReview ? (
        <ReviewEditor
          review={editingReview}
          onCancel={() => setEditingReview(null)}
          onSaved={(updated) => {
            setState((current) => ({
              ...current,
              items: current.items.map((item) => (item.id === updated.id ? updated : item)),
            }));
            setEditingReview(null);
          }}
        />
      ) : null}

      {state.loading ? (
        <Card className="space-y-4">
          <div className="h-6 w-48 animate-pulse rounded-full bg-muted" />
          <div className="h-28 animate-pulse rounded-[1.75rem] bg-muted" />
          <div className="h-28 animate-pulse rounded-[1.75rem] bg-muted" />
        </Card>
      ) : null}

      {state.error ? (
        <Alert variant="warning" title={t("failedToLoad")}>
          {state.error.message}
        </Alert>
      ) : null}

      {!state.loading && !state.error && state.items.length === 0 ? (
        <EmptyState
          icon={FileTextIcon}
          title={t("noReviewsYet")}
          description={t("customerReviewsEmptyDescription")}
        />
      ) : null}

      {!state.loading && state.items.length > 0 ? (
        <div className="space-y-4">
          {state.items.map((review) => {
            const productHref = routes.public.productDetail(review.productSlug || review.productId || review.id);

            return (
              <Card key={review.id} className="space-y-4 rounded-[1.75rem]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{review.productName}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>{t("rating")}: {review.rating ?? "-"}</span>
                      <span>{formatDate(review.createdAt, locale)}</span>
                      {review.updatedAt ? <span>{formatDate(review.updatedAt, locale)}</span> : null}
                    </div>
                  </div>
                  <Badge variant={getVariant(review.status)}>{t(review.status)}</Badge>
                </div>
                {review.title ? (
                  <p className="text-sm font-semibold text-foreground">{review.title}</p>
                ) : null}
                {review.comment ? (
                  <p className="text-sm leading-7 text-muted-foreground">{review.comment}</p>
                ) : null}
                {review.rejectionReason ? (
                  <Alert variant="warning" title={t("rejectionReason")}>
                    {review.rejectionReason}
                  </Alert>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <Link href={productHref}>
                    <Button variant="outline">{t("viewProduct")}</Button>
                  </Link>
                  {review.availableActions.canEdit ? (
                    <Button variant="outline" onClick={() => setEditingReview(review)}>
                      {t("editReview")}
                    </Button>
                  ) : null}
                  {review.availableActions.canDelete ? (
                    <Button variant="danger" onClick={() => setDeletingReview(review)}>
                      {t("deleteReview")}
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}

      <ConfirmationDialog
        open={Boolean(deletingReview)}
        title={t("deleteReview")}
        description={t("deleteReviewConfirmation")}
        confirmLabel={isDeleting ? t("deleting") : t("deleteReview")}
        cancelLabel={t("cancel")}
        onConfirm={handleDelete}
        onCancel={() => setDeletingReview(null)}
        tone="destructive"
      />
    </div>
  );
}
