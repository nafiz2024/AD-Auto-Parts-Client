"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import { getAdminAccessState } from "@/features/admin/admin-access";
import {
  downloadAdminInvoicePdf,
  getAdminInvoiceDetail,
  runInvoiceAction,
} from "@/features/admin/invoices/admin-invoices-api";
import { InvoicePreview } from "@/features/invoices/invoice-ui";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

function LoadingState() {
  return (
    <Card className="space-y-4">
      <div className="h-8 w-64 animate-pulse rounded-full bg-muted" />
      <div className="h-[520px] animate-pulse rounded-[2rem] bg-muted" />
    </Card>
  );
}

export function AdminInvoiceDetailPage({ invoiceNumber }) {
  const auth = useAuth();
  const router = useRouter();
  const { t, locale } = useLanguage();
  const toast = useToast();
  const [state, setState] = useState({
    loading: true,
    error: null,
    invoice: null,
    downloading: false,
    dialogOpen: false,
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

    async function loadInvoice() {
      setState((current) => ({ ...current, loading: true, error: null }));

      try {
        const invoice = await getAdminInvoiceDetail(invoiceNumber);

        if (active) {
          setState((current) => ({
            ...current,
            loading: false,
            invoice,
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

    loadInvoice();

    return () => {
      active = false;
    };
  }, [auth, invoiceNumber, refreshKey, router]);

  async function handleDownload() {
    if (!state.invoice) {
      return;
    }

    setState((current) => ({ ...current, downloading: true }));

    try {
      await downloadAdminInvoicePdf(state.invoice);
    } catch (error) {
      toast.apiError(error, t("failedToDownloadInvoice"));
    } finally {
      setState((current) => ({ ...current, downloading: false }));
    }
  }

  async function handleVoidInvoice() {
    if (!state.invoice?.availableActions?.void) {
      return;
    }

    setState((current) => ({ ...current, mutating: true }));

    try {
      await runInvoiceAction(state.invoice.availableActions.void);
      toast.success(t("invoice"), t("invoiceVoidedSuccessfully"));
      setState((current) => ({
        ...current,
        dialogOpen: false,
        mutating: false,
      }));
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setState((current) => ({ ...current, mutating: false }));
      toast.apiError(error, t("invoice"));
    }
  }

  if (auth.isLoading || state.loading) {
    return <LoadingState />;
  }

  if (state.error) {
    return (
      <Alert variant="warning" title={t("failedToLoad")}>
        {state.error.message}
      </Alert>
    );
  }

  if (!state.invoice) {
    return (
      <EmptyState
        title={t("invoiceNotFound")}
        description={t("invoiceNotFoundDescription")}
        actionLabel={t("backToInvoices")}
        actionHref={routes.admin.adminInvoices}
      />
    );
  }

  return (
    <>
      <InvoicePreview
        invoice={state.invoice}
        locale={locale}
        t={t}
        title={state.invoice.invoiceNumber}
        description={t("adminInvoicePreviewDescription")}
        action={
          <div className="flex flex-wrap gap-3">
            <Link href={routes.admin.adminInvoices}>
              <Button variant="outline">
                <ArrowLeftIcon className="size-4" />
                {t("backToInvoices")}
              </Button>
            </Link>
            {state.invoice.orderNumber ? (
              <Link href={routes.admin.adminOrderDetail(state.invoice.orderNumber)}>
                <Button variant="outline">{t("viewOrder")}</Button>
              </Link>
            ) : null}
            {state.invoice.availableActions.canDownloadPdf ? (
              <Button onClick={handleDownload} disabled={state.downloading}>
                {state.downloading ? t("downloadingPdf") : t("downloadPdf")}
              </Button>
            ) : null}
          </div>
        }
        secondaryAction={
          state.invoice.customer.id ? (
            <Link href={routes.admin.adminCustomerDetail(state.invoice.customer.id)}>
              <Button variant="outline">{t("viewCustomer")}</Button>
            </Link>
          ) : null
        }
        tertiaryAction={
          state.invoice.availableActions.void ? (
            <Button variant="outline" onClick={() => setState((current) => ({ ...current, dialogOpen: true }))}>
              {t("voidInvoice")}
            </Button>
          ) : null
        }
      />

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
            mutating: false,
          }))
        }
        onConfirm={handleVoidInvoice}
      />
    </>
  );
}
