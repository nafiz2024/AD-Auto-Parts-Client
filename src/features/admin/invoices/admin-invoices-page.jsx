"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TableRowSkeleton } from "@/components/states/loading-states";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { routes } from "@/constants/routes";
import { resolveAdminLoadMessage } from "@/features/admin/admin-api-ui";
import { getAdminAccessState } from "@/features/admin/admin-access";
import {
  downloadAdminInvoicePdf,
  getAdminInvoices,
  runInvoiceAction,
} from "@/features/admin/invoices/admin-invoices-api";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import {
  InvoiceListCard,
  InvoiceListEmptyState,
} from "@/features/invoices/invoice-ui";

export function AdminInvoicesPage() {
  const auth = useAuth();
  const router = useRouter();
  const { t, locale } = useLanguage();
  const toast = useToast();
  const [state, setState] = useState({
    loading: true,
    error: null,
    invoices: [],
    downloading: "",
    dialogOpen: false,
    pendingVoidInvoice: null,
    mutating: false,
  });
  const [refreshKey, setRefreshKey] = useState(0);

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

    async function loadInvoices() {
      setState((current) => ({ ...current, loading: true, error: null }));

      try {
        const invoices = await getAdminInvoices();

        if (active) {
          setState((current) => ({
            ...current,
            loading: false,
            invoices,
          }));
        }
      } catch (error) {
        if (active) {
          setState((current) => ({
            ...current,
            loading: false,
            error,
          }));
        }
      }
    }

    loadInvoices();

    return () => {
      active = false;
    };
  }, [auth, refreshKey, router]);

  async function handleDownload(invoice) {
    setState((current) => ({ ...current, downloading: invoice.invoiceNumber }));

    try {
      await downloadAdminInvoicePdf(invoice);
    } catch (error) {
      toast.apiError(error, t("failedToDownloadInvoice"));
    } finally {
      setState((current) => ({ ...current, downloading: "" }));
    }
  }

  async function handleConfirmVoid() {
    if (!state.pendingVoidInvoice?.availableActions?.void) {
      return;
    }

    setState((current) => ({ ...current, mutating: true }));

    try {
      await runInvoiceAction(state.pendingVoidInvoice.availableActions.void);
      toast.success(t("invoice"), t("invoiceVoidedSuccessfully"));
      setState((current) => ({
        ...current,
        dialogOpen: false,
        pendingVoidInvoice: null,
        mutating: false,
      }));
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setState((current) => ({ ...current, mutating: false }));
      toast.apiError(error, t("invoice"));
    }
  }

  if (auth.isLoading || state.loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("invoices")} description={t("adminInvoicesDescription")} />
        <TableRowSkeleton rows={5} />
      </div>
    );
  }

  if (state.error) {
    return (
      <Alert variant="warning" title={t("failedToLoad")}>
        {resolveAdminLoadMessage(state.error, t("failedToLoadDescription"))}
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("invoices")}
        description={t("adminInvoicesDescription")}
        action={
          <Link href={routes.admin.adminOrders}>
            <Button variant="outline">{t("orders")}</Button>
          </Link>
        }
      />

      {state.invoices.length === 0 ? (
        <InvoiceListEmptyState
          title={t("noInvoicesFound")}
          description={t("adminInvoicesEmptyDescription")}
        />
      ) : (
        <Card className="space-y-4">
          {state.invoices.map((invoice) => (
            <InvoiceListCard
              key={invoice.id}
              invoice={invoice}
              locale={locale}
              t={t}
              viewHref={routes.admin.adminInvoiceDetail(invoice.invoiceNumber)}
              onDownload={
                invoice.availableActions.canDownloadPdf
                  ? () => handleDownload(invoice)
                  : null
              }
              downloadPending={state.downloading === invoice.invoiceNumber}
              extraActions={
                invoice.availableActions.void ? (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setState((current) => ({
                        ...current,
                        dialogOpen: true,
                        pendingVoidInvoice: invoice,
                      }))
                    }
                  >
                    {t("voidInvoice")}
                  </Button>
                ) : null
              }
            />
          ))}
        </Card>
      )}

      <ConfirmationDialog
        open={state.dialogOpen}
        title={t("voidInvoice")}
        description={t("voidInvoiceConfirmation")}
        confirmLabel={state.mutating ? t("saving") : t("voidInvoice")}
        cancelLabel={t("cancel")}
        tone="warning"
        onCancel={() =>
          setState((current) => ({
            ...current,
            dialogOpen: false,
            pendingVoidInvoice: null,
            mutating: false,
          }))
        }
        onConfirm={handleConfirmVoid}
      />
    </div>
  );
}
