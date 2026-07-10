"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { UserIcon } from "@/components/ui/icons";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { routes } from "@/constants/routes";
import { buildCustomerLoginHref } from "@/lib/auth/customer-auth";
import {
  downloadCustomerInvoicePdf,
  getCustomerInvoices,
} from "@/features/invoices/invoice-api";
import {
  InvoiceListCard,
  InvoiceListEmptyState,
} from "@/features/invoices/invoice-ui";

function LoadingState() {
  return (
    <Card className="space-y-4">
      <div className="h-6 w-40 animate-pulse rounded-full bg-muted" />
      <div className="h-24 animate-pulse rounded-3xl bg-muted" />
      <div className="h-24 animate-pulse rounded-3xl bg-muted" />
    </Card>
  );
}

function useCustomerAccessState() {
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
          actionHref={buildCustomerLoginHref(routes.customer.accountInvoices)}
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

export function CustomerInvoicesSection() {
  const accessState = useCustomerAccessState();
  const { t, locale } = useLanguage();
  const toast = useToast();
  const [state, setState] = useState({
    loading: true,
    error: null,
    invoices: [],
    downloading: "",
  });

  useEffect(() => {
    let active = true;

    async function loadInvoices() {
      setState((current) => ({ ...current, loading: true, error: null }));

      try {
        const invoices = await getCustomerInvoices();

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
  }, []);

  async function handleDownload(invoiceNumber) {
    setState((current) => ({ ...current, downloading: invoiceNumber }));

    try {
      await downloadCustomerInvoicePdf(invoiceNumber);
    } catch (error) {
      toast.apiError(error, t("failedToDownloadInvoice"));
    } finally {
      setState((current) => ({ ...current, downloading: "" }));
    }
  }

  if (accessState) {
    return accessState;
  }

  if (state.loading) {
    return <LoadingState />;
  }

  if (state.error?.status === 401) {
    return (
      <EmptyState
        icon={UserIcon}
        title={t("accountAccessRequired")}
        description={t("accountAccessRequiredDescription")}
        actionLabel={t("signInToContinue")}
        actionHref={buildCustomerLoginHref(routes.customer.accountInvoices)}
      />
    );
  }

  if (state.error) {
    return (
      <Alert variant="warning" title={t("failedToLoad")}>
        {state.error.message}
      </Alert>
    );
  }

  if (state.invoices.length === 0) {
    return (
      <InvoiceListEmptyState
        title={t("noInvoicesFound")}
        description={t("noInvoicesDescription")}
      />
    );
  }

  return (
    <Card className="space-y-4">
      {state.invoices.map((invoice) => (
        <InvoiceListCard
          key={invoice.id}
          invoice={invoice}
          locale={locale}
          t={t}
          viewHref={routes.customer.accountInvoiceDetail(invoice.invoiceNumber)}
          onDownload={() => handleDownload(invoice.invoiceNumber)}
          downloadPending={state.downloading === invoice.invoiceNumber}
        />
      ))}
    </Card>
  );
}

export function CustomerInvoicesPage() {
  const accessState = useCustomerAccessState();
  const { t } = useLanguage();

  if (accessState) {
    return accessState;
  }

  return (
    <Container className="space-y-8 py-8 pb-16 lg:py-10">
      <PageHeader
        title={t("invoices")}
        description={t("customerInvoicesDescription")}
      />
      <CustomerInvoicesSection />
    </Container>
  );
}
