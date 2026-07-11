"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardCardSkeleton, TableRowSkeleton } from "@/components/states/loading-states";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  BoxIcon,
  MessageCircleIcon,
  RefreshCcwIcon,
  ShoppingCartIcon,
  TruckIcon,
  WalletIcon,
} from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { PriceDisplay } from "@/components/ui/price-display";
import { routes } from "@/constants/routes";
import { resolveAdminLoadMessage } from "@/features/admin/admin-api-ui";
import { getAdminAccessState } from "@/features/admin/admin-access";
import { getAdminDashboardData } from "@/features/admin/dashboard-api";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";

const statusToneMap = {
  delivered: "success",
  paid: "success",
  active: "success",
  processing: "warning",
  pending: "warning",
  review: "warning",
  confirmed: "info",
  shipped: "info",
  cancelled: "error",
  canceled: "error",
};

const metricIconMap = {
  totalOrders: ShoppingCartIcon,
  codOrders: WalletIcon,
  totalProducts: BoxIcon,
  paidAmount: WalletIcon,
  pendingShipments: TruckIcon,
  pendingReturns: RefreshCcwIcon,
  pendingEnquiries: MessageCircleIcon,
  lowStock: BoxIcon,
};

function formatDate(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function getTone(value = "") {
  const normalized = String(value).toLowerCase();

  for (const [key, tone] of Object.entries(statusToneMap)) {
    if (normalized.includes(key)) {
      return tone;
    }
  }

  return "neutral";
}

function MetricValue({ metric }) {
  const { locale } = useLanguage();

  if (metric.format === "currency") {
    return <PriceDisplay amountMinor={metric.value ?? 0} locale={locale} className="text-3xl" />;
  }

  return <span>{metric.value ?? "--"}</span>;
}

function MetricCard({ icon, metric, title }) {
  const Icon = icon;

  return (
    <Card className="space-y-4 rounded-[2rem]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-red/8 text-brand-red">
          <Icon className="size-6" />
        </div>
        <Badge variant={getTone(title)}>{title}</Badge>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-3xl font-semibold text-foreground">
          <MetricValue metric={metric} />
        </p>
      </div>
    </Card>
  );
}

function SimpleBars({ items }) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-foreground">{item.label}</span>
            <span className="text-muted-foreground">{item.count}</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand-red"
              style={{ width: `${Math.max((item.count / max) * 100, 8)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusLegend({ items }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            <span
              className={`size-3 rounded-full ${
                getTone(item.label) === "success"
                  ? "bg-success"
                  : getTone(item.label) === "warning"
                    ? "bg-warning"
                    : getTone(item.label) === "info"
                      ? "bg-blue-500"
                      : getTone(item.label) === "error"
                        ? "bg-error"
                        : "bg-muted-foreground"
              }`}
            />
            <span className="text-foreground">{item.label}</span>
          </div>
          <span className="text-muted-foreground">
            {item.count} ({item.percentage}%)
          </span>
        </div>
      ))}
    </div>
  );
}

function AdminDashboardContent({ data }) {
  const { t } = useLanguage();
  const metricTitles = {
    totalOrders: t("totalOrders"),
    codOrders: "COD Orders",
    totalProducts: "Total Products",
    paidAmount: t("paidAmount"),
    pendingShipments: t("pendingShipments"),
    pendingReturns: t("pendingReturns"),
    pendingEnquiries: t("pendingEnquiries"),
    lowStock: t("lowStock"),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard")}
        description={t("adminDashboardDescription")}
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">{t("last7Days")}</Button>
            <Link href={routes.admin.adminProductNew}>
              <Button>{t("addProduct")}</Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {data.metrics.map((metric) => {
          const Icon = metricIconMap[metric.key] ?? BoxIcon;
          const title = metricTitles[metric.key] ?? metric.label;
          return <MetricCard key={metric.key} metric={metric} icon={Icon} title={title} />;
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[2rem]">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-foreground">{t("orderSummary")}</h2>
            <Badge variant="info">{t("recentOrders")}</Badge>
          </div>
          {data.orderStatusBreakdown.length === 0 ? (
            <EmptyState
              icon={ShoppingCartIcon}
              title={t("orders")}
              description={t("adminEmptyDashboardDescription")}
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
              <SimpleBars items={data.orderStatusBreakdown} />
              <div className="rounded-[1.75rem] border border-border p-5">
                <h3 className="mb-4 text-lg font-semibold text-foreground">{t("ordersByStatus")}</h3>
                <StatusLegend items={data.orderStatusBreakdown} />
              </div>
            </div>
          )}
        </Card>

        <Card className="rounded-[2rem]">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-foreground">{t("recentNotifications")}</h2>
            <Badge variant="warning">{data.unreadNotifications}</Badge>
          </div>
          {data.notifications.length === 0 ? (
            <EmptyState
              icon={MessageCircleIcon}
              title={t("recentNotifications")}
              description={t("noNotificationsYet")}
            />
          ) : (
            <div className="space-y-4">
              {data.notifications.map((item) => (
                <div key={item.id} className="rounded-[1.75rem] border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <Badge variant={item.read ? "neutral" : "info"}>
                      {item.read ? t("statusRead") : t("statusUnread")}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.message}</p>
                  <p className="mt-3 text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[2rem]">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-foreground">{t("recentOrders")}</h2>
            <Link href={routes.admin.adminOrders}>
              <Button variant="ghost" size="sm">
                {t("viewAll")}
              </Button>
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <EmptyState
              icon={ShoppingCartIcon}
              title={t("recentOrders")}
              description={t("adminEmptyDashboardDescription")}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-start text-muted-foreground">
                    <th className="pb-3">{t("orders")}</th>
                    <th className="pb-3">{t("customers")}</th>
                    <th className="pb-3">{t("phone")}</th>
                    <th className="pb-3">{t("total")}</th>
                    <th className="pb-3">{t("paymentMethod")}</th>
                    <th className="pb-3">{t("status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border/70 last:border-b-0">
                      <td className="py-4 font-semibold text-foreground">{order.orderNumber}</td>
                      <td className="py-4 text-foreground">{order.customerName}</td>
                      <td className="py-4 text-muted-foreground">{order.customerPhone}</td>
                      <td className="py-4">
                        {order.amountMinor !== null ? (
                          <PriceDisplay amountMinor={order.amountMinor} />
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="py-4 text-muted-foreground">{order.paymentMethod}</td>
                      <td className="py-4">
                        <Badge variant={getTone(order.orderStatus)}>{order.orderStatus}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="rounded-[2rem]">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-foreground">{t("quickActions")}</h2>
          </div>
          <div className="grid gap-3">
            <Link href={routes.admin.adminProductNew}>
              <Button className="w-full justify-start">{t("addProduct")}</Button>
            </Link>
            <Link href={routes.admin.adminProducts}>
              <Button className="w-full justify-start" variant="outline">
                {t("products")}
              </Button>
            </Link>
            <Link href={routes.admin.adminOrders}>
              <Button className="w-full justify-start" variant="outline">
                {t("orders")}
              </Button>
            </Link>
            <Link href={routes.admin.adminEnquiries}>
              <Button className="w-full justify-start" variant="outline">
                {t("enquiries")}
              </Button>
            </Link>
          </div>
          <div className="mt-6 space-y-4 rounded-[1.75rem] border border-border p-5">
            <h3 className="text-lg font-semibold text-foreground">{t("adminQueueSummary")}</h3>
            {[data.pendingShipments, data.pendingReturns, data.pendingEnquiries].map(
              (items, index) => {
                const titles = [
                  t("pendingShipments"),
                  t("pendingReturns"),
                  t("pendingEnquiries"),
                ];

                return (
                  <div key={titles[index]} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">{titles[index]}</span>
                    <Badge variant="warning">{items.length}</Badge>
                  </div>
                );
              },
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[2rem]">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-foreground">{t("lowStock")}</h2>
            <Link href={routes.admin.adminProducts}>
              <Button variant="ghost" size="sm">
                {t("viewAll")}
              </Button>
            </Link>
          </div>
          {data.lowStockProducts.length === 0 ? (
            <EmptyState
              icon={BoxIcon}
              title={t("lowStock")}
              description={t("adminNoLowStockDescription")}
            />
          ) : (
            <div className="space-y-4">
              {data.lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-border p-4"
                >
                  <div>
                    <p className="font-semibold text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.sku} | {product.category}
                    </p>
                  </div>
                  <Badge variant="warning">{product.stockQuantity}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="rounded-[2rem]">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-foreground">{t("recentProducts")}</h2>
            <Link href={routes.admin.adminProducts}>
              <Button variant="ghost" size="sm">
                {t("viewAll")}
              </Button>
            </Link>
          </div>
          {data.recentProducts.length === 0 ? (
            <EmptyState
              icon={BoxIcon}
              title={t("recentProducts")}
              description={t("adminEmptyDashboardDescription")}
            />
          ) : (
            <div className="space-y-4">
              {data.recentProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-border p-4"
                >
                  <div>
                    <p className="font-semibold text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.sku} | {product.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {product.priceMinor !== null ? (
                      <PriceDisplay amountMinor={product.priceMinor} />
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                    <Badge variant={getTone(product.status)}>{product.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  const auth = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const access = useMemo(() => getAdminAccessState(auth.session), [auth.session]);

  useEffect(() => {
    if (auth.isLoading || !access.canAccessDashboard) {
      return undefined;
    }

    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const nextData = await getAdminDashboardData();

        if (active) {
          setData(nextData);
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

    loadDashboard();

    return () => {
      active = false;
    };
  }, [access.canAccessDashboard, auth.isLoading]);

  if (auth.isLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <DashboardCardSkeleton key={index} />
          ))}
        </div>
        <TableRowSkeleton rows={6} />
        <div className="grid gap-6 xl:grid-cols-2">
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="warning" title={t("failedToLoad")}>
        {resolveAdminLoadMessage(error, t("failedToLoadDescription"))}
      </Alert>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon={BoxIcon}
        title={t("dashboard")}
        description={t("adminEmptyDashboardDescription")}
      />
    );
  }

  return <AdminDashboardContent data={data} />;
}
