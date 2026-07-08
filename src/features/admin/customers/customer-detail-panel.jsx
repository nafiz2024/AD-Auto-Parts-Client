"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PriceDisplay } from "@/components/ui/price-display";
import { XIcon } from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import {
  getAdminCustomerDetail,
  updateAdminCustomerStatus,
} from "@/features/admin/customers/admin-customers-api";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

function formatDate(value, locale) {
  if (!value) {
    return "--";
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

function getStatusVariant(status) {
  const normalized = String(status).toLowerCase();

  if (normalized.includes("block")) {
    return "error";
  }

  if (normalized.includes("inactive") || normalized.includes("disable")) {
    return "warning";
  }

  return "success";
}

function buildOrdersHref(customer) {
  if (!customer?.availableActions?.canViewOrders) {
    return null;
  }

  if (customer?.availableActions?.canFilterOrdersByCustomer && customer?.email) {
    return `${routes.admin.adminOrders}?customerEmail=${encodeURIComponent(customer.email)}`;
  }

  if (customer?.availableActions?.canFilterOrdersByCustomer && customer?.phone) {
    return `${routes.admin.adminOrders}?customerPhone=${encodeURIComponent(customer.phone)}`;
  }

  return routes.admin.adminOrders;
}

function buildEnquiriesHref(customer) {
  if (!customer?.availableActions?.canViewEnquiries) {
    return null;
  }

  const query = customer?.email || customer?.phone || customer?.name;

  if (!query) {
    return routes.admin.adminEnquiries;
  }

  return `${routes.admin.adminEnquiries}?q=${encodeURIComponent(query)}`;
}

function StatCard({ label, value, price = false }) {
  return (
    <Card className="rounded-[1.5rem] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <div className="mt-3">
        {price ? <PriceDisplay amountMinor={value} /> : <p className="text-xl font-semibold text-foreground">{value}</p>}
      </div>
    </Card>
  );
}

export function CustomerDetailPanel({
  customerId,
  open,
  onClose,
  onRefreshList,
  onRequestStatusChange,
}) {
  const { t, locale } = useLanguage();
  const toast = useToast();
  const [state, setState] = useState({
    loading: false,
    error: null,
    customer: null,
    refreshing: false,
  });

  useEffect(() => {
    if (!open || !customerId) {
      return undefined;
    }

    let active = true;

    async function loadDetail(refreshing = false) {
      try {
        if (active) {
          setState((current) => ({
            ...current,
            loading: !refreshing,
            refreshing,
            error: null,
          }));
        }

        const customer = await getAdminCustomerDetail(customerId);

        if (active) {
          setState({
            loading: false,
            refreshing: false,
            error: null,
            customer,
          });
        }
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            refreshing: false,
            error,
            customer: null,
          });
        }
      }
    }

    loadDetail();

    return () => {
      active = false;
    };
  }, [customerId, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  async function refreshDetail() {
    if (!customerId) {
      return;
    }

    try {
      setState((current) => ({ ...current, refreshing: true, error: null }));
      const customer = await getAdminCustomerDetail(customerId);
      setState({
        loading: false,
        refreshing: false,
        error: null,
        customer,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        refreshing: false,
        error,
      }));
    }
  }

  async function handleStatusUpdate(nextStatus) {
    if (!state.customer) {
      return;
    }

    if (typeof onRequestStatusChange === "function") {
      onRequestStatusChange(state.customer, nextStatus);
      return;
    }

    try {
      await updateAdminCustomerStatus(state.customer.id, { status: nextStatus });
      toast.success(t("customerUpdatedSuccessfully"), t("customerStatusChangedDescription"));
      await Promise.all([refreshDetail(), onRefreshList?.()]);
    } catch (error) {
      toast.apiError(error, t("customers"));
    }
  }

  if (!open) {
    return null;
  }

  const customer = state.customer;
  const ordersHref = buildOrdersHref(customer);
  const enquiriesHref = buildEnquiriesHref(customer);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-brand-navy/30 backdrop-blur-sm">
      <button
        type="button"
        className="hidden flex-1 cursor-default lg:block"
        onClick={onClose}
        aria-label={t("closePanel")}
      />
      <aside className="flex h-full w-full max-w-[32rem] flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-border bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("customerDetails")}</p>
              {customer ? (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold text-foreground">{customer.name}</h2>
                  <Badge variant={getStatusVariant(customer.status)}>{t(customer.status)}</Badge>
                </div>
              ) : null}
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
            <>
              <Card className="rounded-[1.5rem] p-5">
                <div className="space-y-3">
                  <div className="h-7 w-40 animate-pulse rounded-2xl bg-muted" />
                  <div className="h-4 w-32 animate-pulse rounded-2xl bg-muted" />
                  <div className="h-4 w-48 animate-pulse rounded-2xl bg-muted" />
                </div>
              </Card>
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} className="rounded-[1.5rem] p-4">
                    <div className="h-4 w-24 animate-pulse rounded-2xl bg-muted" />
                    <div className="mt-3 h-7 w-20 animate-pulse rounded-2xl bg-muted" />
                  </Card>
                ))}
              </div>
            </>
          ) : null}

          {!state.loading && state.error ? (
            <Alert variant="error" title={t("failedToLoad")}>
              <div className="space-y-4">
                <p>{t("customerDetailLoadError")}</p>
                <Button variant="outline" onClick={refreshDetail}>
                  {t("retry")}
                </Button>
              </div>
            </Alert>
          ) : null}

          {!state.loading && !state.error && customer ? (
            <>
              <Card className="rounded-[1.5rem] p-5">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.email || "--"}</p>
                    </div>
                    <Badge variant={getStatusVariant(customer.status)}>{t(customer.status)}</Badge>
                  </div>
                  <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em]">{t("customerSince")}</p>
                      <p className="mt-1 text-foreground">{formatDate(customer.createdAt, locale)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em]">{t("lastOrder")}</p>
                      <p className="mt-1 text-foreground">{formatDate(customer.lastOrderDate, locale)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em]">{t("phone")}</p>
                      <p className="mt-1 text-foreground">{customer.phone || "--"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em]">{t("customerNumber")}</p>
                      <p className="mt-1 text-foreground">{customer.customerNumber || "--"}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <StatCard label={t("totalOrders")} value={customer.orderSummary.totalOrders} />
                <StatCard label={t("totalSpent")} value={customer.orderSummary.totalSpentMinor} price />
                <StatCard label={t("averageOrder")} value={customer.orderSummary.averageOrderMinor} price />
                <StatCard
                  label={t("customerEngagement")}
                  value={`${customer.orderSummary.reviewCount} / ${customer.orderSummary.questionCount}`}
                />
              </div>

              <Card className="rounded-[1.5rem] p-5">
                <h3 className="text-lg font-semibold text-foreground">{t("contactInformation")}</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t("email")}</p>
                    <p className="font-medium text-foreground">{customer.email || "--"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("phone")}</p>
                    <p className="font-medium text-foreground">{customer.phone || "--"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("defaultAddress")}</p>
                    <p className="font-medium leading-6 text-foreground">
                      {customer.defaultAddress || t("noDefaultAddress")}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="rounded-[1.5rem] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-foreground">{t("orderHistory")}</h3>
                  {ordersHref ? (
                    <Link href={ordersHref}>
                      <Button size="sm" variant="outline">{t("viewAllOrders")}</Button>
                    </Link>
                  ) : null}
                </div>
                {customer.recentOrders.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {customer.recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-border/80 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-foreground">{order.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(order.createdAt, locale)}
                          </p>
                        </div>
                        <div className="text-end">
                          <PriceDisplay amountMinor={order.totalMinor} />
                          <div className="mt-2">
                            <Badge variant={getStatusVariant(order.status)}>{order.statusLabel}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">{t("noRecentOrders")}</p>
                )}
              </Card>

              <Card className="rounded-[1.5rem] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-foreground">{t("recentEnquiries")}</h3>
                  {enquiriesHref ? (
                    <Link href={enquiriesHref}>
                      <Button size="sm" variant="outline">{t("viewEnquiries")}</Button>
                    </Link>
                  ) : null}
                </div>
                {customer.recentEnquiries.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {customer.recentEnquiries.map((enquiry) => (
                      <div
                        key={enquiry.id}
                        className="rounded-[1.25rem] border border-border/80 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">{enquiry.subject}</p>
                            <p className="text-sm text-muted-foreground">{enquiry.enquiryNumber}</p>
                          </div>
                          <Badge variant={getStatusVariant(enquiry.status)}>{enquiry.status}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {formatDate(enquiry.createdAt, locale)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">{t("noRecentEnquiries")}</p>
                )}
              </Card>

              {customer.notes.length > 0 ? (
                <Card className="rounded-[1.5rem] p-5">
                  <h3 className="text-lg font-semibold text-foreground">{t("adminNotes")}</h3>
                  <div className="mt-4 space-y-3">
                    {customer.notes.map((note) => (
                      <div key={note.id} className="rounded-[1.25rem] border border-border/80 px-4 py-3">
                        <p className="text-sm leading-6 text-foreground">{note.body}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatDate(note.createdAt, locale)}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}
            </>
          ) : null}
        </div>

        {customer ? (
          <div className="sticky bottom-0 border-t border-border bg-white px-5 py-4">
            <div className="flex flex-wrap gap-3">
              {customer.availableActions.canDeactivate ? (
                <Button variant="outline" onClick={() => handleStatusUpdate("inactive")}>
                  {t("deactivate")}
                </Button>
              ) : null}
              {customer.availableActions.canActivate ? (
                <Button variant="outline" onClick={() => handleStatusUpdate("active")}>
                  {t("reactivate")}
                </Button>
              ) : null}
              {customer.availableActions.canBlock ? (
                <Button variant="danger" onClick={() => handleStatusUpdate("blocked")}>
                  {t("blockCustomer")}
                </Button>
              ) : null}
              <Button variant="ghost" onClick={refreshDetail} disabled={state.refreshing}>
                {state.refreshing ? t("loading") : t("refresh")}
              </Button>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
