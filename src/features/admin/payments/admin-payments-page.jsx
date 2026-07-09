"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TableRowSkeleton } from "@/components/states/loading-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ExternalLinkIcon, WalletIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PriceDisplay } from "@/components/ui/price-display";
import { Select } from "@/components/ui/select";
import { routes } from "@/constants/routes";
import { getAdminAccessState } from "@/features/admin/admin-access";
import { getAdminPayments, updateAdminPaymentStatus } from "@/features/admin/payments/admin-payments-api";
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

function getStatusVariant(status) {
  const normalized = String(status).toLowerCase();

  if (normalized.includes("approve") || normalized.includes("paid")) {
    return "success";
  }

  if (normalized.includes("reject")) {
    return "error";
  }

  return "warning";
}

function buildFilters(searchParamsValue) {
  const searchParams = new URLSearchParams(searchParamsValue);

  return {
    page: Math.max(Number.parseInt(searchParams.get("page") || "1", 10) || 1, 1),
    status: searchParams.get("status") || "",
    orderNumber: searchParams.get("orderNumber") || "",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
  };
}

export function AdminPaymentsPage() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
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
    selectedId: "",
  });
  const [dialogState, setDialogState] = useState({
    open: false,
    action: "",
    item: null,
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
        const result = await getAdminPayments(filters);

        if (active) {
          setState((current) => ({
            ...current,
            loading: false,
            error: null,
            items: result.items,
            pagination: result.pagination,
            selectedId: current.selectedId || result.items[0]?.id || "",
          }));
        }
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            error,
            items: [],
            pagination: null,
            selectedId: "",
          });
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

  async function handleConfirm() {
    if (!dialogState.item) {
      return;
    }

    setDialogState((current) => ({ ...current, submitting: true }));

    try {
      await updateAdminPaymentStatus(dialogState.item.id, {
        status: dialogState.action,
        reason: dialogState.reason || undefined,
      });
      toast.success(
        t("manualPayments"),
        dialogState.action === "approved"
          ? t("paymentApprovedSuccessfully")
          : t("paymentRejectedSuccessfully"),
      );
      setDialogState({ open: false, action: "", item: null, reason: "", submitting: false });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setDialogState((current) => ({ ...current, submitting: false }));
      toast.apiError(error, t("manualPayments"));
    }
  }

  const selectedPayment = state.items.find((item) => item.id === state.selectedId) ?? null;

  if (state.loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("manualPayments")} description={t("adminPaymentsDescription")} />
        <TableRowSkeleton rows={8} />
      </div>
    );
  }

  if (state.error) {
    return (
      <ErrorState
        title={t("failedToLoad")}
        description={t("adminPaymentsLoadError")}
        actionLabel={t("retry")}
        onAction={() => setRefreshKey((value) => value + 1)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("manualPayments")} description={t("adminPaymentsDescription")} />

      <Card className="space-y-5 rounded-[2rem]">
        <form
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            replaceFilters({
              page: 1,
              status: draftFilters.status,
              orderNumber: draftFilters.orderNumber,
              dateFrom: draftFilters.dateFrom,
              dateTo: draftFilters.dateTo,
            });
          }}
        >
          <Select
            value={draftFilters.status}
            onChange={(event) => updateDraftFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="">{t("allPaymentStatuses")}</option>
            <option value="pending">{t("pending")}</option>
            <option value="approved">{t("approved")}</option>
            <option value="rejected">{t("rejected")}</option>
          </Select>
          <Input
            value={draftFilters.orderNumber}
            onChange={(event) => updateDraftFilters((current) => ({ ...current, orderNumber: event.target.value }))}
            placeholder={t("searchOrderNumber")}
          />
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
          <div className="flex flex-wrap gap-3 xl:col-span-4">
            <Button type="submit">{t("applyFilters")}</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                replaceFilters({
                  page: null,
                  status: null,
                  orderNumber: null,
                  dateFrom: null,
                  dateTo: null,
                })
              }
            >
              {t("clearFilters")}
            </Button>
          </div>
        </form>

        {state.items.length === 0 ? (
          <EmptyState
            icon={WalletIcon}
            title={t("paymentSubmissions")}
            description={t("adminPaymentsEmptyDescription")}
          />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              {state.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setState((current) => ({ ...current, selectedId: item.id }))}
                  className={`w-full rounded-[1.75rem] border p-4 text-start transition ${
                    state.selectedId === item.id
                      ? "border-brand-red bg-brand-red/5"
                      : "border-border hover:border-brand-red/40"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{item.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">{item.customerName}</p>
                    </div>
                    <Badge variant={getStatusVariant(item.status)}>{item.statusLabel}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                    <PriceDisplay amountMinor={item.amountMinor} />
                    <span className="text-muted-foreground">{formatDate(item.submittedAt)}</span>
                  </div>
                </button>
              ))}
            </div>

            <Card className="h-fit space-y-4 rounded-[2rem]">
              {selectedPayment ? (
                <>
                  <h2 className="text-xl font-semibold text-foreground">{t("paymentSubmissionDetails")}</h2>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">{t("orderNumber")}</p>
                      <p className="font-medium text-foreground">{selectedPayment.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("customer")}</p>
                      <p className="font-medium text-foreground">{selectedPayment.customerName}</p>
                      <p className="text-muted-foreground">{selectedPayment.customerContact}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("proofAmount")}</p>
                      <PriceDisplay amountMinor={selectedPayment.amountMinor} />
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("referenceNumber")}</p>
                      <p className="font-medium text-foreground">{selectedPayment.referenceNumber || "--"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("date")}</p>
                      <p className="font-medium text-foreground">{formatDate(selectedPayment.paymentDate)}</p>
                    </div>
                    {selectedPayment.note ? (
                      <div>
                        <p className="text-muted-foreground">{t("notes")}</p>
                        <p className="font-medium text-foreground">{selectedPayment.note}</p>
                      </div>
                    ) : null}
                    {selectedPayment.proofUrl ? (
                      <a href={selectedPayment.proofUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <ExternalLinkIcon className="size-4" />
                          {t("viewSubmission")}
                        </Button>
                      </a>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-3 border-t border-border pt-4">
                    {selectedPayment.canApprove ? (
                      <Button
                        onClick={() =>
                          setDialogState({
                            open: true,
                            action: "approved",
                            item: selectedPayment,
                            reason: "",
                            submitting: false,
                          })
                        }
                      >
                        {t("approvePayment")}
                      </Button>
                    ) : null}
                    {selectedPayment.canReject ? (
                      <Button
                        variant="outline"
                        onClick={() =>
                          setDialogState({
                            open: true,
                            action: "rejected",
                            item: selectedPayment,
                            reason: "",
                            submitting: false,
                          })
                        }
                      >
                        {t("rejectPayment")}
                      </Button>
                    ) : null}
                  </div>
                </>
              ) : (
                <EmptyState title={t("paymentSubmissions")} description={t("selectPaymentSubmission")} />
              )}
            </Card>
          </div>
        )}
      </Card>

      <ConfirmationDialog
        open={dialogState.open}
        title={dialogState.action === "approved" ? t("approvePayment") : t("rejectPayment")}
        description={t("areYouSure")}
        confirmLabel={dialogState.submitting ? t("saving") : t("updateStatus")}
        cancelLabel={t("cancel")}
        onCancel={() => setDialogState({ open: false, action: "", item: null, reason: "", submitting: false })}
        onConfirm={handleConfirm}
        tone="warning"
        reasonLabel={dialogState.action === "rejected" ? t("reasonForRejection") : t("optionalNote")}
        reasonPlaceholder={dialogState.action === "rejected" ? t("enterRejectionReason") : t("enterStatusReason")}
        reasonValue={dialogState.reason}
        onReasonChange={(reason) => setDialogState((current) => ({ ...current, reason }))}
      />
    </div>
  );
}
