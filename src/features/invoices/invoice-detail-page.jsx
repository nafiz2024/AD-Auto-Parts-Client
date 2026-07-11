"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowLeftIcon, UserIcon } from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import {
  downloadCustomerInvoicePdf,
  getCustomerInvoiceDetail,
} from "@/features/invoices/invoice-api";
import { InvoicePreview } from "@/features/invoices/invoice-ui";
import { buildCustomerLoginHref } from "@/lib/auth/customer-auth";
import { resolveApiUiMessage } from "@/lib/api/ui-errors";

function LoadingState() {
  return (
    <Card className="space-y-4">
      <div className="h-8 w-64 animate-pulse rounded-full bg-muted" />
      <div className="h-[480px] animate-pulse rounded-[2rem] bg-muted" />
    </Card>
  );
}

function useCustomerInvoiceAccessState(invoiceNumber) {
  const { isLoading, isAuthenticated, role } = useAuth();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <Container className="py-10">
        <LoadingState />
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container className="py-10">
        <EmptyState
          icon={UserIcon}
          title={t("accountAccessRequired")}
          description={t("accountAccessRequiredDescription")}
          actionLabel={t("signInToContinue")}
          actionHref={buildCustomerLoginHref(routes.customer.accountInvoiceDetail(invoiceNumber))}
        />
      </Container>
    );
  }

  if (role === "admin") {
    return (
      <Container className="py-10">
        <Alert variant="warning" title={t("customerOnlyArea")}>
          {t("customerOnlyAreaDescription")}
        </Alert>
      </Container>
    );
  }

  return null;
}

export function CustomerInvoiceDetailPage({ invoiceNumber }) {
  const accessState = useCustomerInvoiceAccessState(invoiceNumber);
  const { t, locale } = useLanguage();
  const toast = useToast();
  const [state, setState] = useState({
    loading: true,
    error: null,
    invoice: null,
    downloading: false,
  });

  useEffect(() => {
    if (!invoiceNumber) {
      setState({
        loading: false,
        error: null,
        invoice: null,
        downloading: false,
      });
      return undefined;
    }

    let active = true;

    async function loadInvoice() {
      setState((current) => ({ ...current, loading: true, error: null }));

      try {
        const invoice = await getCustomerInvoiceDetail(invoiceNumber);

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
  }, [invoiceNumber]);

  async function handleDownload() {
    setState((current) => ({ ...current, downloading: true }));

    try {
      await downloadCustomerInvoicePdf(state.invoice);
    } catch (error) {
      toast.apiError(error, t("failedToDownloadInvoice"));
    } finally {
      setState((current) => ({ ...current, downloading: false }));
    }
  }

  if (accessState) {
    return accessState;
  }

  if (state.loading) {
    return <LoadingState />;
  }

  if (state.error) {
    return (
      <Alert variant="warning" title={t("failedToLoad")}>
        {resolveApiUiMessage(state.error, t("failedToLoadDescription"), { routeScope: "Account API" })}
      </Alert>
    );
  }

  if (!state.invoice) {
    return (
      <EmptyState
        title={t("invoiceNotFound")}
        description={t("invoiceNotFoundDescription")}
        actionLabel={t("backToInvoices")}
        actionHref={routes.customer.accountInvoices}
      />
    );
  }

  return (
    <InvoicePreview
      invoice={state.invoice}
      locale={locale}
      t={t}
      title={t("invoice")}
      description={t("customerInvoicePreviewDescription")}
      action={
        <div className="flex flex-wrap gap-3">
          <Link href={routes.customer.accountInvoices}>
            <Button variant="outline">
              <ArrowLeftIcon className="size-4" />
              {t("backToInvoices")}
            </Button>
          </Link>
          {state.invoice?.pdfPath ? (
            <Button onClick={handleDownload} disabled={state.downloading}>
              {state.downloading ? t("downloadingPdf") : t("downloadPdf")}
            </Button>
          ) : null}
        </div>
      }
    />
  );
}
