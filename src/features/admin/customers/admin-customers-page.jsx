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
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PriceDisplay } from "@/components/ui/price-display";
import { Select } from "@/components/ui/select";
import { UsersIcon } from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import { getAdminAccessState } from "@/features/admin/admin-access";
import {
  getAdminCustomers,
  updateAdminCustomerStatus,
} from "@/features/admin/customers/admin-customers-api";
import { CustomerDetailPanel } from "@/features/admin/customers/customer-detail-panel";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

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
    q: searchParams.get("q") || "",
    status: searchParams.get("status") || "",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
    selected: searchParams.get("selected") || "",
  };
}

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

function CustomerTable({ items, locale, t, onView }) {
  return (
    <div className="hidden overflow-x-auto xl:block">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border text-start text-muted-foreground">
            <th className="pb-3">{t("customerName")}</th>
            <th className="pb-3">{t("phone")}</th>
            <th className="pb-3">{t("email")}</th>
            <th className="pb-3">{t("totalOrders")}</th>
            <th className="pb-3">{t("totalSpent")}</th>
            <th className="pb-3">{t("lastOrder")}</th>
            <th className="pb-3">{t("status")}</th>
            <th className="pb-3">{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((customer) => {
            const ordersHref = buildOrdersHref(customer);
            const enquiriesHref = buildEnquiriesHref(customer);

            return (
              <tr key={customer.id} className="border-b border-border/70 align-top last:border-b-0">
                <td className="py-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.customerNumber || t("customerSince")}: {formatDate(customer.createdAt, locale)}
                    </p>
                  </div>
                </td>
                <td className="py-4 text-muted-foreground">{customer.phone || "--"}</td>
                <td className="py-4 text-muted-foreground">{customer.email || "--"}</td>
                <td className="py-4 text-muted-foreground">{customer.totalOrders}</td>
                <td className="py-4">
                  <PriceDisplay amountMinor={customer.totalSpentMinor} />
                </td>
                <td className="py-4 text-muted-foreground">{formatDate(customer.lastOrderDate, locale)}</td>
                <td className="py-4">
                  <Badge variant={getStatusVariant(customer.status)}>{t(customer.status)}</Badge>
                </td>
                <td className="py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => onView(customer.id)}>
                      {t("viewDetails")}
                    </Button>
                    {ordersHref ? (
                      <Link href={ordersHref}>
                        <Button size="sm" variant="outline">{t("viewOrders")}</Button>
                      </Link>
                    ) : null}
                    {enquiriesHref ? (
                      <Link href={enquiriesHref}>
                        <Button size="sm" variant="outline">{t("viewEnquiries")}</Button>
                      </Link>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CustomerCards({ items, locale, t, onView }) {
  return (
    <div className="grid gap-4 xl:hidden">
      {items.map((customer) => {
        const ordersHref = buildOrdersHref(customer);
        const enquiriesHref = buildEnquiriesHref(customer);

        return (
          <Card key={customer.id} className="space-y-4 rounded-[2rem]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground">{customer.name}</p>
                <p className="text-sm text-muted-foreground">{customer.email || customer.phone || "--"}</p>
              </div>
              <Badge variant={getStatusVariant(customer.status)}>{t(customer.status)}</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("totalOrders")}</p>
                <p className="mt-1 font-medium text-foreground">{customer.totalOrders}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("totalSpent")}</p>
                <div className="mt-1">
                  <PriceDisplay amountMinor={customer.totalSpentMinor} />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("lastOrder")}</p>
                <p className="mt-1 font-medium text-foreground">{formatDate(customer.lastOrderDate, locale)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("customerSince")}</p>
                <p className="mt-1 font-medium text-foreground">{formatDate(customer.createdAt, locale)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => onView(customer.id)}>{t("viewDetails")}</Button>
              {ordersHref ? (
                <Link href={ordersHref}>
                  <Button size="sm" variant="outline">{t("viewOrders")}</Button>
                </Link>
              ) : null}
              {enquiriesHref ? (
                <Link href={enquiriesHref}>
                  <Button size="sm" variant="outline">{t("viewEnquiries")}</Button>
                </Link>
              ) : null}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function AdminCustomersPage() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t, locale } = useLanguage();
  const toast = useToast();
  const searchKey = searchParams.toString();
  const filters = useMemo(() => buildFilters(searchKey), [searchKey]);
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
    capabilities: {
      canExport: false,
    },
  });
  const [dialogState, setDialogState] = useState({
    open: false,
    customer: null,
    nextStatus: "",
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

    async function loadPage() {
      try {
        if (active) {
          setState((current) => ({ ...current, loading: true, error: null }));
        }

        const result = await getAdminCustomers(filters);

        if (active) {
          setState({
            loading: false,
            error: null,
            items: result.items,
            pagination: result.pagination,
            statusTabs: result.statusTabs,
            capabilities: result.capabilities,
          });
        }
      } catch (error) {
        if (active) {
          setState((current) => ({
            ...current,
            loading: false,
            error,
            items: [],
            pagination: null,
            statusTabs: [],
          }));
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [auth, filters, refreshKey, router]);

  function replaceFilters(updates) {
    const query = updateSearchParams(searchParams.toString(), updates);
    const nextHref = query ? `${pathname}?${query}` : pathname;
    const currentHref = searchKey ? `${pathname}?${searchKey}` : pathname;

    if (nextHref !== currentHref) {
      router.replace(nextHref);
    }
  }

  function openCustomer(customerId) {
    replaceFilters({
      selected: customerId,
    });
  }

  function closeCustomer() {
    replaceFilters({
      selected: null,
    });
  }

  function handleApplyFilters(event) {
    event.preventDefault();
    replaceFilters({
      page: 1,
      q: draftFilters.q,
      status: draftFilters.status,
      dateFrom: draftFilters.dateFrom,
      dateTo: draftFilters.dateTo,
    });
  }

  function handleClearFilters() {
    updateDraftFilters({
      page: 1,
      q: "",
      status: "",
      dateFrom: "",
      dateTo: "",
      selected: filters.selected,
    });
    replaceFilters({
      page: null,
      q: null,
      status: null,
      dateFrom: null,
      dateTo: null,
    });
  }

  async function handleConfirmStatusChange() {
    if (!dialogState.customer || !dialogState.nextStatus) {
      return;
    }

    setDialogState((current) => ({ ...current, submitting: true }));

    try {
      await updateAdminCustomerStatus(dialogState.customer.id, {
        status: dialogState.nextStatus,
      });
      toast.success(t("customerUpdatedSuccessfully"), t("customerStatusChangedDescription"));
      setDialogState({
        open: false,
        customer: null,
        nextStatus: "",
        submitting: false,
      });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setDialogState((current) => ({ ...current, submitting: false }));
      toast.apiError(error, t("customers"));
    }
  }

  if (state.loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("customers")} description={t("adminCustomersDescription")} />
        <TableRowSkeleton rows={8} />
      </div>
    );
  }

  if (state.error) {
    return (
      <ErrorState
        title={t("failedToLoad")}
        description={t("adminCustomersLoadError")}
        actionLabel={t("retry")}
        onAction={() => setRefreshKey((value) => value + 1)}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title={t("customers")}
          description={t("adminCustomersDescription")}
          action={
            state.capabilities.canExport ? (
              <Button
                variant="outline"
                onClick={() => toast.info(t("exportCustomers"), t("exportDeferredDescription"))}
              >
                {t("exportCustomers")}
              </Button>
            ) : null
          }
        />

        <Card className="space-y-5 rounded-[2rem]">
          <div className="flex flex-wrap gap-2 border-b border-border pb-4">
            {(state.statusTabs.length > 0
              ? state.statusTabs
              : [{ key: "all", label: "All", count: state.items.length }]).map((tab) => {
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
                    active ? "bg-brand-red text-white" : "bg-muted/50 text-foreground hover:bg-muted"
                  }`}
                >
                  {t(tab.key) || tab.label} ({tab.count})
                </button>
              );
            })}
          </div>

          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" onSubmit={handleApplyFilters}>
            <Input
              value={draftFilters.q}
              onChange={(event) => updateDraftFilters((current) => ({ ...current, q: event.target.value }))}
              placeholder={t("searchCustomers")}
              className="xl:col-span-2"
            />
            <Select
              value={draftFilters.status}
              onChange={(event) => updateDraftFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">{t("allStatuses")}</option>
              <option value="active">{t("active")}</option>
              <option value="inactive">{t("inactive")}</option>
              <option value="blocked">{t("blocked")}</option>
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
            <div className="flex flex-wrap gap-3 xl:col-span-5">
              <Button type="submit">{t("applyFilters")}</Button>
              <Button type="button" variant="outline" onClick={handleClearFilters}>
                {t("clearFilters")}
              </Button>
            </div>
          </form>

          {state.items.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title={t("customers")}
              description={t("noCustomersFound")}
            />
          ) : (
            <>
              <CustomerTable items={state.items} locale={locale} t={t} onView={openCustomer} />
              <CustomerCards items={state.items} locale={locale} t={t} onView={openCustomer} />
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
                    onClick={() => replaceFilters({ page: Math.max((state.pagination?.currentPage ?? 1) - 1, 1) })}
                  >
                    {t("previous")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(state.pagination?.currentPage ?? 1) >= (state.pagination?.totalPages ?? 1)}
                    onClick={() => replaceFilters({ page: (state.pagination?.currentPage ?? 1) + 1 })}
                  >
                    {t("next")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      <CustomerDetailPanel
        customerId={filters.selected}
        open={Boolean(filters.selected)}
        onClose={closeCustomer}
        onRefreshList={() => setRefreshKey((value) => value + 1)}
        onRequestStatusChange={(customer, nextStatus) =>
          setDialogState({
            open: true,
            customer,
            nextStatus,
            submitting: false,
          })
        }
      />

      <ConfirmationDialog
        open={dialogState.open}
        title={t("updateCustomerStatus")}
        description={t("areYouSure")}
        confirmLabel={dialogState.submitting ? t("saving") : t("updateStatus")}
        cancelLabel={t("cancel")}
        onCancel={() =>
          setDialogState({
            open: false,
            customer: null,
            nextStatus: "",
            submitting: false,
          })
        }
        onConfirm={handleConfirmStatusChange}
        tone={dialogState.nextStatus === "blocked" ? "destructive" : "warning"}
        itemPreview={
          dialogState.customer ? (
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{dialogState.customer.name}</p>
              <p className="text-sm text-muted-foreground">{dialogState.customer.email || dialogState.customer.phone || "--"}</p>
              <p className="text-sm text-foreground">
                {t("newStatus")}: {t(dialogState.nextStatus)}
              </p>
            </div>
          ) : null
        }
      />
    </>
  );
}
