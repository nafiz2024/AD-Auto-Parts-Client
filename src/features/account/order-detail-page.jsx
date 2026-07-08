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
import { BoxIcon, WalletIcon } from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { getCustomerOrderDetail } from "@/features/account/account-api";

function formatDate(value) {
  if (!value) {
    return "—";
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
    normalized.includes("paid") || normalized.includes("delivered")
      ? "success"
      : normalized.includes("pending") || normalized.includes("processing")
        ? "warning"
        : normalized.includes("confirmed") || normalized.includes("submitted")
          ? "info"
          : "neutral";

  return <Badge variant={variant}>{value}</Badge>;
}

function useOrderAccessState() {
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
          actionHref={routes.public.contact}
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
  const accessState = useOrderAccessState();
  const { t } = useLanguage();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            <p className="text-2xl font-semibold text-foreground">{order.productName || t("orders")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill value={order.status} />
            <StatusPill value={order.paymentStatus} />
            <StatusPill value={order.shipmentStatus} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">{t("paymentMethod")}</p>
            <p className="font-medium text-foreground">{order.paymentMethod}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("total")}</p>
            <PriceDisplay amountMinor={order.totalMinor} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("invoiceNumber")}</p>
            <p className="font-medium text-foreground">{order.invoiceNumber || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("trackingNumber")}</p>
            <p className="font-medium text-foreground">{order.trackingNumber || "—"}</p>
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
                  <PriceDisplay amountMinor={item.amountMinor} />
                </div>
              </div>
            ))
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">{t("recentActivity")}</h2>
          <div className="rounded-3xl border border-border p-4">
            <p className="text-sm text-muted-foreground">{t("shipmentStatus")}</p>
            <p className="font-medium text-foreground">{order.shipmentStatus}</p>
          </div>
          <div className="rounded-3xl border border-border p-4">
            <p className="text-sm text-muted-foreground">{t("shippingAddress")}</p>
            <p className="font-medium text-foreground">{order.shippingAddress || "—"}</p>
          </div>
          <div className="rounded-3xl border border-border p-4">
            <p className="text-sm text-muted-foreground">{t("billingAddress")}</p>
            <p className="font-medium text-foreground">{order.billingAddress || "—"}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={routes.customer.accountPayments}>
              <Button>
                <WalletIcon className="size-4" />
                {t("goToPayments")}
              </Button>
            </Link>
            <Link href={routes.customer.accountInvoices}>
              <Button variant="outline">{t("goToInvoices")}</Button>
            </Link>
          </div>
        </Card>
      </div>
    </Container>
  );
}
