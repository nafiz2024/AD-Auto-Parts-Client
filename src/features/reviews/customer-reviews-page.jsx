"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FileTextIcon } from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import { useLanguage } from "@/hooks/use-language";
import { buildCustomerLoginHref } from "@/lib/auth/customer-auth";
import { resolveApiUiMessage } from "@/lib/api/ui-errors";
import { getCustomerReviews } from "@/features/reviews/review-api";

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

export function CustomerReviewsPage() {
  const { t, locale } = useLanguage();
  const [filters, setFilters] = useState({ status: "", q: "" });
  const [state, setState] = useState({
    loading: true,
    error: null,
    items: [],
  });

  function renderSignInRequired() {
    return (
      <EmptyState
        icon={FileTextIcon}
        title={t("accountAccessRequired")}
        description={t("accountAccessRequiredDescription")}
        actionLabel={t("signInToContinue")}
        actionHref={buildCustomerLoginHref(routes.customer.accountReviews)}
      />
    );
  }

  useEffect(() => {
    let active = true;

    async function load() {
      setState((current) => ({ ...current, loading: true, error: null }));

      try {
        const result = await getCustomerReviews();

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
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedQuery = filters.q.trim().toLowerCase();

    return state.items.filter((item) => {
      const matchesStatus = !filters.status || item.status === filters.status;
      const matchesQuery =
        !normalizedQuery ||
        [item.productName, item.title, item.comment, item.reviewNumber]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));

      return matchesStatus && matchesQuery;
    });
  }, [filters.q, filters.status, state.items]);

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

      {state.loading ? (
        <Card className="space-y-4">
          <div className="h-6 w-48 animate-pulse rounded-full bg-muted" />
          <div className="h-28 animate-pulse rounded-[1.75rem] bg-muted" />
          <div className="h-28 animate-pulse rounded-[1.75rem] bg-muted" />
        </Card>
      ) : null}

      {!state.loading && state.error?.status === 401 ? renderSignInRequired() : null}

      {state.error ? (
        state.error?.status === 401 ? null : (
          <Alert variant="warning" title={t("failedToLoad")}>
            {resolveApiUiMessage(state.error, t("failedToLoadDescription"), { routeScope: "Account API" })}
          </Alert>
        )
      ) : null}

      {!state.loading && !state.error && filteredItems.length === 0 ? (
        <EmptyState
          icon={FileTextIcon}
          title={t("noReviewsYet")}
          description={t("customerReviewsEmptyDescription")}
        />
      ) : null}

      {!state.loading && filteredItems.length > 0 ? (
        <div className="space-y-4">
          {filteredItems.map((review) => {
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
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
