"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TableRowSkeleton } from "@/components/states/loading-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ShoppingCartIcon, TruckIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PriceDisplay } from "@/components/ui/price-display";
import { Select } from "@/components/ui/select";
import { routes } from "@/constants/routes";
import { resolveAdminLoadMessage } from "@/features/admin/admin-api-ui";
import { getAdminAccessState } from "@/features/admin/admin-access";
import { cancelAdminOrder, getAdminOrders } from "@/features/admin/orders/admin-orders-api";
import {
  notifyAdminOrdersRefresh,
  subscribeAdminOrdersRefresh,
} from "@/features/admin/orders/admin-orders-refresh";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

function formatDate(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function getStatusVariant(status) {
  const normalized = String(status).toLowerCase();

  if (normalized.includes("unpaid") || normalized.includes("reject")) {
    return "error";
  }

  if (normalized.includes("refund")) {
    return "neutral";
  }

  if (normalized.includes("deliver") || normalized.includes("paid") || normalized.includes("approve")) {
    return "success";
  }

  if (normalized.includes("process") || normalized.includes("pending")) {
    return "warning";
  }

  if (normalized.includes("ship") || normalized.includes("confirm")) {
    return "info";
  }

  if (normalized.includes("cancel") || normalized.includes("return") || normalized.includes("reject")) {
    return "error";
  }

  return "neutral";
}

function updateSearchParams(current, updates) {
  const params = new URLSearchParams(current);

  Object.entries(updates).forEach(([key, value]) => {
    if (value === "" || value === null || value === undefined) {
      params.delete(key);
      return;
    }

    params.set(key, String(value));
  });

  return params.toString();
}

function buildFilters(searchParamsValue) {
  const searchParams = new URLSearchParams(searchParamsValue);

  return {
    page: Math.max(Number.parseInt(searchParams.get("page") || "1", 10) || 1, 1),
    status: searchParams.get("status") || "",
    paymentStatus: searchParams.get("paymentStatus") || "",
    orderNumber: searchParams.get("orderNumber") || "",
    customerPhone: searchParams.get("customerPhone") || "",
    customerEmail: searchParams.get("customerEmail") || "",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
    minAmount: searchParams.get("minAmount") || "",
    maxAmount: searchParams.get("maxAmount") || "",
  };
}

function OrderTable({ items, t, onCancelOrder }) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border text-start text-muted-foreground">
            <th className="pb-3">{t("orderNumber")}</th>
            <th className="pb-3">{t("customer")}</th>
            <th className="pb-3">{t("productCount")}</th>
            <th className="pb-3">{t("total")}</th>
            <th className="pb-3">{t("paymentMethod")}</th>
            <th className="pb-3">Fulfillment Method</th>
            <th className="pb-3">{t("paymentStatus")}</th>
            <th className="pb-3">{t("orderStatus")}</th>
            <th className="pb-3">{t("shipmentStatus")}</th>
            <th className="pb-3">{t("date")}</th>
            <th className="pb-3">{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((order) => (
            <tr key={order.id} className="border-b border-border/70 align-top last:border-b-0">
              <td className="py-4">
                <p className="font-semibold text-foreground">{order.orderNumber}</p>
              </td>
              <td className="py-4">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">{order.customerSummary}</p>
                </div>
              </td>
              <td className="py-4 text-muted-foreground">{order.itemCount}</td>
              <td className="py-4">
                <PriceDisplay amountMinor={order.totalMinor} />
              </td>
              <td className="py-4 text-muted-foreground">{order.paymentMethod}</td>
              <td className="py-4 text-muted-foreground">{order.fulfillmentMethod}</td>
              <td className="py-4">
                <Badge variant={getStatusVariant(order.paymentStatus)}>
                  {order.paymentStatusLabel}
                </Badge>
              </td>
              <td className="py-4">
                <Badge variant={getStatusVariant(order.orderStatus)}>
                  {order.orderStatusLabel}
                </Badge>
              </td>
              <td className="py-4">
                <Badge variant={getStatusVariant(order.shipmentStatus)}>
                  {order.shipmentStatusLabel}
                </Badge>
              </td>
              <td className="py-4 text-muted-foreground">{formatDate(order.createdAt)}</td>
              <td className="py-4">
                <div className="flex flex-wrap gap-2">
                  <Link href={routes.admin.adminOrderDetail(order.orderNumber)}>
                    <Button size="sm" variant="outline">
                      {t("viewOrder")}
                    </Button>
                  </Link>
                  {order.invoiceNumber ? (
                    <Link href={routes.admin.adminInvoiceDetail(order.invoiceNumber)}>
                      <Button size="sm" variant="outline">
                        {t("viewInvoice")}
                      </Button>
                    </Link>
                  ) : null}
                  {order.canCancel ? (
                    <Button size="sm" variant="outline" onClick={() => onCancelOrder(order)}>
                      {t("cancelOrder")}
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderCards({ items, t, onCancelOrder }) {
  return (
    <div className="grid gap-4 lg:hidden">
      {items.map((order) => (
        <Card key={order.id} className="space-y-4 rounded-[2rem]">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-lg font-semibold text-foreground">{order.orderNumber}</p>
              <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
            </div>
            <Badge variant={getStatusVariant(order.orderStatus)}>{order.orderStatusLabel}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("customer")}</p>
              <p className="mt-1 font-medium text-foreground">{order.customerName}</p>
              <p className="text-sm text-muted-foreground">{order.customerSummary}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("total")}</p>
              <div className="mt-1">
                <PriceDisplay amountMinor={order.totalMinor} />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Fulfillment Method
              </p>
              <p className="mt-1 font-medium text-foreground">{order.fulfillmentMethod}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("paymentStatus")}</p>
              <div className="mt-2">
                <Badge variant={getStatusVariant(order.paymentStatus)}>{order.paymentStatusLabel}</Badge>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("shipmentStatus")}</p>
              <div className="mt-2">
                <Badge variant={getStatusVariant(order.shipmentStatus)}>{order.shipmentStatusLabel}</Badge>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("productCount")}</p>
              <p className="mt-1 font-medium text-foreground">{order.itemCount}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={routes.admin.adminOrderDetail(order.orderNumber)}>
              <Button size="sm">{t("viewOrder")}</Button>
            </Link>
            {order.invoiceNumber ? (
              <Link href={routes.admin.adminInvoiceDetail(order.invoiceNumber)}>
                <Button size="sm" variant="outline">{t("viewInvoice")}</Button>
              </Link>
            ) : null}
            {order.canCancel ? (
              <Button size="sm" variant="outline" onClick={() => onCancelOrder(order)}>
                {t("cancelOrder")}
              </Button>
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  );
}

export function AdminOrdersPage() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const toast = useToast();
  const searchKey = searchParams.toString();
  const filters = useMemo(() => buildFilters(searchKey), [searchKey]);
  const access = useMemo(() => getAdminAccessState(auth.session), [auth.session]);
  const [draftState, setDraftState] = useState({
    key: searchKey,
    values: filters,
  });
  const [state, setState] = useState({
    loading: true,
    error: null,
    items: [],
    pagination: null,
    statusTabs: [],
  });
  const [dialogState, setDialogState] = useState({
    open: false,
    order: null,
    reason: "",
    submitting: false,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const draftFilters = draftState.key === searchKey ? draftState.values : filters;

  function updateDraftFilters(updater) {
    setDraftState((current) => ({
      key: searchKey,
      values:
        typeof updater === "function"
          ? updater(current.key === searchKey ? current.values : filters)
          : updater,
    }));
  }

  useEffect(() => {
    if (auth.isLoading || !access.canAccessDashboard) {
      return undefined;
    }

    let active = true;

    async function loadPage() {
      try {
        if (active) {
          setState((current) => ({ ...current, loading: true, error: null }));
        }
        const result = await getAdminOrders(filters);

        if (active) {
          setState({
            loading: false,
            error: null,
            items: result.items,
            pagination: result.pagination,
            statusTabs: result.statusTabs,
          });
        }
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            error,
            items: [],
            pagination: null,
            statusTabs: [],
          });
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [access.canAccessDashboard, auth.isLoading, filters, refreshKey]);

  useEffect(() => {
    if (!access.canAccessDashboard) {
      return undefined;
    }

    return subscribeAdminOrdersRefresh(() => {
      setRefreshKey((value) => value + 1);
    });
  }, [access.canAccessDashboard]);

  function replaceFilters(updates) {
    const query = updateSearchParams(searchParams.toString(), updates);
    const nextHref = query ? `${pathname}?${query}` : pathname;
    const currentHref = searchKey ? `${pathname}?${searchKey}` : pathname;

    if (nextHref !== currentHref) {
      router.replace(nextHref);
    }
  }

  function handleApplyFilters(event) {
    event.preventDefault();
    replaceFilters({
      page: 1,
      status: draftFilters.status,
      paymentStatus: draftFilters.paymentStatus,
      orderNumber: draftFilters.orderNumber,
      customerPhone: draftFilters.customerPhone,
      customerEmail: draftFilters.customerEmail,
      dateFrom: draftFilters.dateFrom,
      dateTo: draftFilters.dateTo,
      minAmount: draftFilters.minAmount,
      maxAmount: draftFilters.maxAmount,
    });
  }

  function handleClearFilters() {
    updateDraftFilters({
      page: 1,
      status: "",
      paymentStatus: "",
      orderNumber: "",
      customerPhone: "",
      customerEmail: "",
      dateFrom: "",
      dateTo: "",
      minAmount: "",
      maxAmount: "",
    });
    replaceFilters({
      page: null,
      status: null,
      paymentStatus: null,
      orderNumber: null,
      customerPhone: null,
      customerEmail: null,
      dateFrom: null,
      dateTo: null,
      minAmount: null,
      maxAmount: null,
    });
  }

  async function handleConfirmCancel() {
    if (!dialogState.order) {
      return;
    }

    setDialogState((current) => ({ ...current, submitting: true }));

    try {
      await cancelAdminOrder(dialogState.order.orderNumber, {
        reason: dialogState.reason || undefined,
      });
      toast.success(t("orders"), t("statusUpdatedSuccessfully"));
      setDialogState({ open: false, order: null, reason: "", submitting: false });
      notifyAdminOrdersRefresh({
        orderNumber: dialogState.order.orderNumber,
        action: "cancel",
      });
    } catch (error) {
      setDialogState((current) => ({ ...current, submitting: false }));
      toast.error(t("orders"), resolveAdminLoadMessage(error, "Unable to update this order."));
    }
  }

  if (state.loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("orders")} description={t("adminOrdersDescription")} />
        <TableRowSkeleton rows={8} />
      </div>
    );
  }

  if (state.error) {
    return (
      <ErrorState
        title={t("failedToLoad")}
        description={resolveAdminLoadMessage(state.error, t("adminOrdersLoadError"))}
        actionLabel={t("retry")}
        onAction={() => setRefreshKey((value) => value + 1)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("orders")}
        description={t("adminOrdersDescription")}
        action={
          <div className="flex flex-wrap gap-3">
            <Link href={routes.admin.adminShipments}>
              <Button variant="outline">
                <TruckIcon className="size-4" />
                {t("shipments")}
              </Button>
            </Link>
          </div>
        }
      />

      <Card className="space-y-5 rounded-[2rem]">
        <div className="flex flex-wrap gap-2 border-b border-border pb-4">
          {(state.statusTabs.length > 0 ? state.statusTabs : [{ key: "all", label: "All", count: state.items.length }]).map((tab) => {
            const active = (filters.status || "all") === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  const nextStatus = tab.key === "all" ? "" : tab.key;
                  updateDraftFilters((current) => ({ ...current, status: nextStatus }));
                  replaceFilters({ page: 1, status: nextStatus });
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-brand-red text-white"
                    : "bg-muted/50 text-foreground hover:bg-muted"
                }`}
              >
                {t(tab.key) || tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={handleApplyFilters}>
          <Input
            value={draftFilters.orderNumber}
            onChange={(event) => updateDraftFilters((current) => ({ ...current, orderNumber: event.target.value }))}
            placeholder={t("searchOrderNumber")}
          />
          <Input
            value={draftFilters.customerPhone}
            onChange={(event) => updateDraftFilters((current) => ({ ...current, customerPhone: event.target.value }))}
            placeholder={t("searchCustomerPhone")}
          />
          <Input
            value={draftFilters.customerEmail}
            onChange={(event) => updateDraftFilters((current) => ({ ...current, customerEmail: event.target.value }))}
            placeholder={t("searchCustomerEmail")}
          />
          <Select
            value={draftFilters.paymentStatus}
            onChange={(event) => updateDraftFilters((current) => ({ ...current, paymentStatus: event.target.value }))}
          >
            <option value="">{t("allPaymentStatuses")}</option>
            <option value="pending">{t("pending")}</option>
            <option value="paid">{t("paid")}</option>
            <option value="approved">{t("approved")}</option>
            <option value="rejected">{t("rejected")}</option>
            <option value="unpaid">{t("unpaid")}</option>
          </Select>
          <Select
            value={draftFilters.status}
            onChange={(event) => updateDraftFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="">{t("allOrderStatuses")}</option>
            <option value="pending">{t("pending")}</option>
            <option value="confirmed">{t("confirmed")}</option>
            <option value="processing">{t("processing")}</option>
            <option value="shipped">{t("shipped")}</option>
            <option value="delivered">{t("delivered")}</option>
            <option value="cancelled">{t("cancelled")}</option>
            <option value="returned">{t("returned")}</option>
          </Select>
          <Input
            type="date"
            value={draftFilters.dateFrom}
            onChange={(event) => updateDraftFilters((current) => ({ ...current, dateFrom: event.target.value }))}
          />
          <Input
            type="date"
            value={draftFilters.dateTo}
            onChange={(event) => updateDraftFilters((current) => ({ ...current, dateTo: event.target.value }))}
          />
          <Input
            value={draftFilters.minAmount}
            onChange={(event) => updateDraftFilters((current) => ({ ...current, minAmount: event.target.value }))}
            placeholder={t("minAmountPlaceholder")}
          />
          <Input
            value={draftFilters.maxAmount}
            onChange={(event) => updateDraftFilters((current) => ({ ...current, maxAmount: event.target.value }))}
            placeholder={t("maxAmountPlaceholder")}
          />
          <div className="flex flex-wrap gap-3 xl:col-span-4">
            <Button type="submit">{t("applyFilters")}</Button>
            <Button type="button" variant="outline" onClick={handleClearFilters}>
              {t("clearFilters")}
            </Button>
          </div>
        </form>

        {state.items.length === 0 ? (
          <EmptyState
            icon={ShoppingCartIcon}
            title={t("orders")}
            description={t("adminOrdersEmptyDescription")}
          />
        ) : (
          <>
            <OrderTable
              items={state.items}
              t={t}
              onCancelOrder={(order) =>
                setDialogState({ open: true, order, reason: "", submitting: false })
              }
            />
            <OrderCards
              items={state.items}
              t={t}
              onCancelOrder={(order) =>
                setDialogState({ open: true, order, reason: "", submitting: false })
              }
            />
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
                    replaceFilters({
                      page: Math.max((state.pagination?.currentPage ?? 1) - 1, 1),
                    })
                  }
                >
                  {t("previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(state.pagination?.currentPage ?? 1) >= (state.pagination?.totalPages ?? 1)}
                  onClick={() =>
                    replaceFilters({
                      page: (state.pagination?.currentPage ?? 1) + 1,
                    })
                  }
                >
                  {t("next")}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <ConfirmationDialog
        open={dialogState.open}
        title={t("cancelOrder")}
        description={t("cancelOrderConfirmation")}
        confirmLabel={dialogState.submitting ? t("saving") : t("cancelOrder")}
        cancelLabel={t("cancel")}
        onCancel={() => setDialogState({ open: false, order: null, reason: "", submitting: false })}
        onConfirm={handleConfirmCancel}
        tone="warning"
        reasonLabel={t("reasonForCancellation")}
        reasonPlaceholder={t("enterCancellationReason")}
        reasonValue={dialogState.reason}
        onReasonChange={(reason) => setDialogState((current) => ({ ...current, reason }))}
        itemPreview={
          dialogState.order ? (
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{dialogState.order.orderNumber}</p>
              <p className="text-sm text-muted-foreground">{dialogState.order.customerName}</p>
            </div>
          ) : null
        }
      />
    </div>
  );
}
