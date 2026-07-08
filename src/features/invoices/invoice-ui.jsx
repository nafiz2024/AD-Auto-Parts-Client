"use client";

import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PriceDisplay } from "@/components/ui/price-display";
import { FileTextIcon } from "@/components/ui/icons";
import { APP_NAME } from "@/config/env";

export function formatInvoiceDate(value, locale, withTime = false) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  if (withTime) {
    return `${date.toLocaleDateString(locale)} ${date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  return date.toLocaleDateString(locale);
}

function getStatusVariant(value = "") {
  const normalized = String(value).toLowerCase();

  if (
    normalized.includes("paid") ||
    normalized.includes("issued") ||
    normalized.includes("success") ||
    normalized.includes("completed")
  ) {
    return "success";
  }

  if (
    normalized.includes("void") ||
    normalized.includes("cancel") ||
    normalized.includes("fail") ||
    normalized.includes("reject")
  ) {
    return "error";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("review") ||
    normalized.includes("draft")
  ) {
    return "warning";
  }

  if (
    normalized.includes("process") ||
    normalized.includes("open") ||
    normalized.includes("confirm")
  ) {
    return "info";
  }

  return "neutral";
}

export function InvoiceStatusBadges({ invoiceStatus, paymentStatus }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {invoiceStatus ? <Badge variant={getStatusVariant(invoiceStatus)}>{invoiceStatus}</Badge> : null}
      {paymentStatus && paymentStatus !== invoiceStatus ? (
        <Badge variant={getStatusVariant(paymentStatus)}>{paymentStatus}</Badge>
      ) : null}
    </div>
  );
}

export function InvoiceAmount({ amountMinor, locale, className = "" }) {
  if (amountMinor === null || amountMinor === undefined) {
    return <span className={`text-muted-foreground ${className}`}>—</span>;
  }

  return <PriceDisplay amountMinor={amountMinor} locale={locale} className={className} />;
}

export function InvoiceListEmptyState({ title, description }) {
  return (
    <EmptyState
      icon={FileTextIcon}
      title={title}
      description={description}
    />
  );
}

export function InvoiceListCard({
  invoice,
  locale,
  t,
  viewHref,
  onDownload,
  downloadPending = false,
  extraActions = null,
}) {
  return (
    <div className="rounded-3xl border border-border p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">{invoice.invoiceNumber}</p>
          <p className="text-sm text-muted-foreground">
            {t("orderNumber")}: {invoice.orderNumber || "—"}
          </p>
        </div>
        <InvoiceStatusBadges
          invoiceStatus={invoice.invoiceStatus}
          paymentStatus={invoice.paymentStatus}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-sm text-muted-foreground">{t("invoiceDate")}</p>
          <p className="font-medium text-foreground">
            {formatInvoiceDate(invoice.issuedAt, locale)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t("paymentStatus")}</p>
          <p className="font-medium text-foreground">{invoice.paymentStatus || "—"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t("invoiceStatus")}</p>
          <p className="font-medium text-foreground">{invoice.invoiceStatus || "—"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t("total")}</p>
          <InvoiceAmount amountMinor={invoice.totalMinor} locale={locale} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {viewHref ? (
          <Link href={viewHref}>
            <Button variant="outline">{t("viewInvoice")}</Button>
          </Link>
        ) : null}
        {onDownload ? (
          <Button onClick={onDownload} disabled={downloadPending}>
            {downloadPending ? t("downloadingPdf") : t("downloadPdf")}
          </Button>
        ) : null}
        {extraActions}
      </div>
    </div>
  );
}

export function InvoicePreview({
  invoice,
  locale,
  t,
  action = null,
  secondaryAction = null,
  tertiaryAction = null,
  title,
  description,
}) {
  const lines = invoice?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} action={action} />

      <Card className="overflow-hidden rounded-[2rem] p-0">
        <div className="border-b border-border px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-semibold text-foreground">{APP_NAME}</p>
                <p className="text-sm text-muted-foreground">{t("qualityPartsTrustedService")}</p>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">{t("invoiceNumber")}</p>
                  <p className="font-semibold text-foreground">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("orderNumber")}</p>
                  <p className="font-semibold text-foreground">{invoice.orderNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("invoiceDate")}</p>
                  <p className="font-medium text-foreground">
                    {formatInvoiceDate(invoice.issuedAt, locale, true)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("printDate")}</p>
                  <p className="font-medium text-foreground">
                    {formatInvoiceDate(invoice.printDate || invoice.issuedAt, locale, true)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 lg:max-w-xs">
              <div className="text-start lg:text-end">
                <p className="text-sm text-muted-foreground">{t("invoiceStatus")}</p>
                <div className="mt-2 flex flex-wrap gap-2 lg:justify-end">
                  <InvoiceStatusBadges
                    invoiceStatus={invoice.invoiceStatus}
                    paymentStatus={invoice.paymentStatus}
                  />
                </div>
              </div>
              {secondaryAction ? <div className="lg:flex lg:justify-end">{secondaryAction}</div> : null}
              {tertiaryAction ? <div className="lg:flex lg:justify-end">{tertiaryAction}</div> : null}
            </div>
          </div>
        </div>

        <div className="grid gap-6 border-b border-border px-6 py-6 sm:px-8 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">{t("customerInformation")}</h2>
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">{t("name")}</dt>
                <dd className="font-medium text-foreground">{invoice.customer.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("phone")}</dt>
                <dd className="font-medium text-foreground">{invoice.customer.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("email")}</dt>
                <dd className="font-medium text-foreground">{invoice.customer.email || "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">{t("deliveryAddress")}</h2>
            <p className="text-sm leading-7 text-foreground">{invoice.deliveryAddress || "—"}</p>
          </div>
        </div>

        <div className="border-b border-border px-6 py-6 sm:px-8">
          {lines.length === 0 ? (
            <Alert title={t("invoice")}>{t("noInvoiceItemsAvailable")}</Alert>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 pe-4">{t("product")}</th>
                    <th className="pb-3 pe-4">{t("sku")}</th>
                    <th className="pb-3 pe-4">{t("unitPrice")}</th>
                    <th className="pb-3 pe-4">{t("quantity")}</th>
                    <th className="pb-3">{t("total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((item) => (
                    <tr key={item.id} className="border-b border-border/70 align-top last:border-b-0">
                      <td className="py-4 pe-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">{item.productName}</p>
                          {item.description ? (
                            <p className="text-xs leading-6 text-muted-foreground">{item.description}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-4 pe-4 text-muted-foreground">{item.sku || "—"}</td>
                      <td className="py-4 pe-4">
                        <InvoiceAmount amountMinor={item.unitPriceMinor} locale={locale} />
                      </td>
                      <td className="py-4 pe-4 text-foreground">{item.quantity ?? "—"}</td>
                      <td className="py-4">
                        <InvoiceAmount amountMinor={item.totalMinor} locale={locale} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t("paymentSummary")}</h2>
              <div className="mt-4 grid gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">{t("paymentMethod")}</p>
                  <p className="font-medium text-foreground">{invoice.paymentMethod || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("paymentStatus")}</p>
                  <p className="font-medium text-foreground">{invoice.paymentStatus || "—"}</p>
                </div>
              </div>
            </div>

            {invoice.termsNote ? (
              <div className="rounded-3xl border border-border bg-muted/30 p-4">
                <p className="font-medium text-foreground">{t("termsAndConditions")}</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{invoice.termsNote}</p>
              </div>
            ) : null}

            <div className="space-y-1">
              <p className="font-medium text-foreground">{t("thankYouForChoosingAdAutoParts")}</p>
              <p className="text-sm text-muted-foreground">{APP_NAME}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-border p-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <InvoiceAmount amountMinor={invoice.subtotalMinor} locale={locale} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{t("deliveryFee")}</span>
                <InvoiceAmount amountMinor={invoice.deliveryFeeMinor} locale={locale} />
              </div>
              {invoice.discountMinor !== null && invoice.discountMinor !== undefined ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t("discount")}</span>
                  <InvoiceAmount amountMinor={invoice.discountMinor} locale={locale} />
                </div>
              ) : null}
              {invoice.taxMinor !== null && invoice.taxMinor !== undefined ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t("taxVat")}</span>
                  <InvoiceAmount amountMinor={invoice.taxMinor} locale={locale} />
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-base font-semibold text-foreground">
                <span>{t("total")}</span>
                <InvoiceAmount amountMinor={invoice.totalMinor} locale={locale} className="text-base" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
