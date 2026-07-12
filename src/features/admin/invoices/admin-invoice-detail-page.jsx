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
import { subscribeAdminOrdersRefresh } from "@/features/admin/orders/admin-orders-refresh";
import { InvoicePreview } from "@/features/invoices/invoice-ui";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { resolveApiUiMessage } from "@/lib/api/ui-errors";

function LoadingState() {
  return (
    <div>
      <Card className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded-full bg-muted" />
        <div className="h-[520px] animate-pulse rounded-[2rem] bg-muted" />
      </Card>
    </div>
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
    const unsubscribe = subscribeAdminOrdersRefresh(() => {
      setRefreshKey((value) => value + 1);
    });

    function handleWindowFocus() {
      setRefreshKey((value) => value + 1);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        setRefreshKey((value) => value + 1);
      }
    }

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      unsubscribe();
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

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

  function handlePrint() {
    window.print();
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
        {resolveApiUiMessage(state.error, t("failedToLoadDescription"), {
          routeScope: "Admin invoice detail",
        })}
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
      <div className="py-2">
        <InvoicePreview
          invoice={state.invoice}
          locale={locale}
          t={t}
          title={state.invoice.invoiceNumber}
          description={t("adminInvoicePreviewDescription")}
          action={
            <div className="print-hidden no-print flex flex-wrap gap-3">
              <Button onClick={handleDownload} disabled={state.downloading}>
                {state.downloading ? "Downloading..." : "Download Invoice"}
              </Button>
              {state.invoice.orderNumber ? (
                <Link href={routes.admin.adminOrderDetail(state.invoice.orderNumber)}>
                  <Button variant="outline">{t("viewOrder")}</Button>
                </Link>
              ) : null}
              <Link href={routes.admin.adminInvoices}>
                <Button variant="outline">
                  <ArrowLeftIcon className="size-4" />
                  {t("backToInvoices")}
                </Button>
              </Link>
            </div>
          }
          secondaryAction={
            <div className="print-hidden no-print flex flex-wrap gap-3 lg:justify-end">
              <Button variant="outline" onClick={handlePrint}>
                Print / Save PDF
              </Button>
              {state.invoice.customer.id ? (
                <Link href={routes.admin.adminCustomerDetail(state.invoice.customer.id)}>
                  <Button variant="outline">{t("viewCustomer")}</Button>
                </Link>
              ) : null}
            </div>
          }
          tertiaryAction={
            state.invoice.availableActions.void ? (
              <div className="print-hidden no-print">
                <Button variant="outline" onClick={() => setState((current) => ({ ...current, dialogOpen: true }))}>
                  {t("voidInvoice")}
                </Button>
              </div>
            ) : null
          }
        />
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          body * {
            visibility: hidden !important;
          }

          #invoice-print-root,
          #invoice-print-root * {
            visibility: visible !important;
          }

          #invoice-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          .invoice-card {
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            border: none !important;
            padding: 12mm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .print-hidden,
          .no-print {
            display: none !important;
          }

          .print-compact {
            margin-top: 0 !important;
            padding-top: 0 !important;
          }

          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

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
