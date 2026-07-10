"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PriceDisplay } from "@/components/ui/price-display";
import { BoxIcon } from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { getCustomerOrderDetail } from "@/features/account/account-api";
import { downloadCustomerInvoicePdf } from "@/features/invoices/invoice-api";
import { buildCustomerLoginHref } from "@/lib/auth/customer-auth";

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function StatusPill({ value }) {
  const normalized = String(value).toLowerCase();
  const variant =
    normalized.includes("paid") ||
    normalized.includes("delivered") ||
    normalized.includes("complete")
      ? "success"
      : normalized.includes("pending") || normalized.includes("processing")
        ? "warning"
        : normalized.includes("confirmed") || normalized.includes("submitted")
          ? "info"
          : "neutral";

  return <Badge variant={variant}>{value}</Badge>;
}

function DetailValue({ amountMinor, value, pendingLabel = "Pending" }) {
  if (amountMinor !== undefined) {
    return amountMinor === null ? (
      <span className="font-medium text-muted-foreground">{pendingLabel}</span>
    ) : (
      <PriceDisplay amountMinor={amountMinor} />
    );
  }

  return <p className="font-medium text-foreground">{value || pendingLabel}</p>;
}

function isUnauthorizedError(error) {
  return error?.status === 401;
}

function isOrderNotFoundError(error) {
  return error?.status === 404 && error?.code === "RESOURCE_NOT_FOUND";
}

function useOrderAccessState(orderNumber) {
  const { isLoading, isAuthenticated, role } = useAuth();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <Container className="py-10">
        <Card className="space-y-4">
          <div className="h-6 w-40 animate-pulse rounded-full bg-muted" />
          <div className="h-32 animate-pulse rounded-3xl bg-muted" />
        </Card>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container className="py-10">
        <EmptyState
          icon={BoxIcon}
          title={t("accountAccessRequired")}
          description={t("accountAccessRequiredDescription")}
          actionLabel={t("signInToContinue")}
          actionHref={buildCustomerLoginHref(routes.customer.accountOrderDetail(orderNumber))}
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

export function AccountOrderDetailPage({ orderNumber }) {
  const accessState = useOrderAccessState(orderNumber);
  const { t } = useLanguage();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  useEffect(() => {
    if (!orderNumber || accessState) {
      return undefined;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const nextOrder = await getCustomerOrderDetail(orderNumber);

        if (active) {
          setOrder(nextOrder);
        }
      } catch (nextError) {
        if (active) {
          setError(nextError);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [accessState, orderNumber]);

  if (accessState) {
    return accessState;
  }

  if (loading) {
    return (
      <Container className="py-10">
        <Card className="space-y-4">
          <div className="h-6 w-40 animate-pulse rounded-full bg-muted" />
          <div className="h-32 animate-pulse rounded-3xl bg-muted" />
          <div className="h-32 animate-pulse rounded-3xl bg-muted" />
        </Card>
      </Container>
    );
  }

  if (error) {
    if (isUnauthorizedError(error)) {
      return (
        <Container className="py-10">
          <EmptyState
            icon={BoxIcon}
            title={t("accountAccessRequired")}
            description={t("accountAccessRequiredDescription")}
            actionLabel={t("signInToContinue")}
            actionHref={buildCustomerLoginHref(routes.customer.accountOrderDetail(orderNumber))}
          />
        </Container>
      );
    }

    if (isOrderNotFoundError(error)) {
      return (
        <Container className="py-10">
          <EmptyState
            title={t("orderNotFound")}
            description={t("orderNotFoundDescription")}
            actionLabel={t("orders")}
            actionHref={routes.customer.accountOrders}
          />
        </Container>
      );
    }

    return (
      <Container className="py-10">
        <Alert variant="warning" title={t("failedToLoad")}>
          {error.message}
        </Alert>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-10">
        <EmptyState
          title={t("noOrdersYet")}
          description={t("noOrdersDescription")}
          actionLabel={t("orders")}
          actionHref={routes.customer.accountOrders}
        />
      </Container>
    );
  }

  async function handleDownloadInvoice() {
    if (!order?.invoiceNumber) {
      return;
    }

    setDownloadingInvoice(true);

    try {
      await downloadCustomerInvoicePdf(order.invoiceNumber);
    } catch (nextError) {
      toast.apiError(nextError, t("failedToDownloadInvoice"));
    } finally {
      setDownloadingInvoice(false);
    }
  }

  return (
    <Container className="space-y-8 py-8 pb-16 lg:py-10">
      <PageHeader
        title={order.orderNumber}
        description={t("orderHistoryDescription")}
        action={
          <Link href={routes.customer.accountOrders}>
            <Button variant="outline">{t("orders")}</Button>
          </Link>
        }
      />

      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
            <p className="text-2xl font-semibold text-foreground">
              {order.productName || t("orders")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill value={order.status} />
            <StatusPill value={order.shipmentStatus} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <div>
            <p className="text-sm text-muted-foreground">{t("paymentMethod")}</p>
            <DetailValue value={order.paymentMethod} pendingLabel={t("pending")} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("deliveryMethod")}</p>
            <DetailValue value={order.fulfillmentMethod} pendingLabel={t("pending")} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("total")}</p>
            <DetailValue amountMinor={order.totalMinor} pendingLabel={t("pending")} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("invoiceNumber")}</p>
            <DetailValue value={order.invoiceNumber} pendingLabel={t("pending")} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("trackingNumber")}</p>
            <DetailValue value={order.trackingNumber} pendingLabel={t("pending")} />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">{t("orderItems")}</h2>
          {order.items.length === 0 ? (
            <EmptyState
              icon={BoxIcon}
              title={t("orderItems")}
              description={t("orderHistoryDescription")}
            />
          ) : (
            order.items.map((item) => (
              <div key={item.id} className="rounded-3xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("quantity")}: {item.quantity}
                    </p>
                  </div>
                  <DetailValue amountMinor={item.amountMinor} pendingLabel={t("pending")} />
                </div>
              </div>
            ))
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">{t("recentActivity")}</h2>
          <div className="rounded-3xl border border-border p-4">
            <p className="text-sm text-muted-foreground">{t("itemTotal")}</p>
            <DetailValue amountMinor={order.itemTotalMinor} pendingLabel={t("pending")} />
          </div>
          <div className="rounded-3xl border border-border p-4">
            <p className="text-sm text-muted-foreground">{t("deliveryFee")}</p>
            <DetailValue amountMinor={order.deliveryFeeMinor} pendingLabel={t("pending")} />
          </div>
          <div className="rounded-3xl border border-border p-4">
            <p className="text-sm text-muted-foreground">{t("shipmentStatus")}</p>
            <DetailValue value={order.shipmentStatus} pendingLabel={t("pending")} />
          </div>
          <div className="rounded-3xl border border-border p-4">
            <p className="text-sm text-muted-foreground">{t("shippingAddress")}</p>
            <DetailValue value={order.shippingAddress} pendingLabel={t("pending")} />
          </div>
          <div className="rounded-3xl border border-border p-4">
            <p className="text-sm text-muted-foreground">{t("billingAddress")}</p>
            <DetailValue value={order.billingAddress} pendingLabel={t("pending")} />
          </div>
          {order.invoiceNumber ? (
            <div className="rounded-3xl border border-border p-4">
              <p className="text-sm text-muted-foreground">{t("invoice")}</p>
              <p className="font-medium text-foreground">{order.invoiceNumber}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={routes.customer.accountInvoiceDetail(order.invoiceNumber)}>
                  <Button variant="outline">{t("viewInvoice")}</Button>
                </Link>
                <Button onClick={handleDownloadInvoice} disabled={downloadingInvoice}>
                  {downloadingInvoice ? t("downloadingPdf") : t("downloadPdf")}
                </Button>
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Link href={routes.customer.accountInvoices}>
              <Button variant="outline">{t("goToInvoices")}</Button>
            </Link>
          </div>
        </Card>
      </div>
    </Container>
  );
}
