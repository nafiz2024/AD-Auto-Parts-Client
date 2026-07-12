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

function getDisplayText(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed && trimmed !== "[object Object]" ? trimmed : null;
}

export function formatInvoiceDate(value, locale, withTime = false) {
  if (!value) {
    return "--";
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

  if (normalized.includes("cancel")) {
    return "error";
  }

  if (normalized.includes("void")) {
    return "neutral";
  }

  if (normalized.includes("unpaid") || normalized.includes("pending")) {
    return "warning";
  }

  if (normalized.includes("issued")) {
    return "info";
  }

  if (
    normalized.includes("delivered") ||
    normalized.includes("paid") ||
    normalized.includes("success") ||
    normalized.includes("completed")
  ) {
    return "success";
  }

  if (normalized.includes("process") || normalized.includes("open") || normalized.includes("confirm")) {
    return "info";
  }

  return "neutral";
}

function StatusBadge({ value, fallback = "--" }) {
  const displayValue = getDisplayText(value) ?? fallback;
  const variant = getDisplayText(value) ? getStatusVariant(value) : "neutral";

  return <Badge variant={variant}>{displayValue}</Badge>;
}

function StatusField({ label, value, fallback = "--", align = "start" }) {
  const containerClass =
    align === "end"
      ? "min-w-[140px] items-start sm:items-end"
      : "min-w-[140px] items-start";

  return (
    <div className={`flex flex-col gap-2 ${containerClass}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className={align === "end" ? "sm:flex sm:justify-end" : ""}>
        <StatusBadge value={value} fallback={fallback} />
      </div>
    </div>
  );
}

function DetailField({ label, value, className = "" }) {
  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}

export function InvoiceAmount({ amountMinor, locale, className = "" }) {
  if (amountMinor === null || amountMinor === undefined) {
    return <span className={`text-muted-foreground ${className}`}>--</span>;
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
  const paymentStatus = getDisplayText(invoice.paymentStatusLabel ?? invoice.paymentStatus);
  const invoiceStatus = getDisplayText(invoice.invoiceStatusLabel ?? invoice.invoiceStatus);

  return (
    <div className="rounded-3xl border border-border p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">{invoice.invoiceNumber}</p>
          <p className="text-sm text-muted-foreground">
            {t("orderNumber")}: {invoice.orderNumber || "--"}
          </p>
        </div>
        <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2 sm:justify-items-end">
          <StatusField label={t("invoiceStatus")} value={invoiceStatus} align="end" />
          <StatusField label={t("paymentStatus")} value={paymentStatus} align="end" />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">{t("invoiceDate")}</p>
          <p className="font-medium text-foreground">
            {formatInvoiceDate(invoice.issuedAt, locale)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t("dueDate")}</p>
          <p className="font-medium text-foreground">
            {formatInvoiceDate(invoice.dueAt, locale)}
          </p>
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
  const lines = Array.isArray(invoice?.items) ? invoice.items : [];
  const invoiceStatus = getDisplayText(invoice.invoiceStatusLabel ?? invoice.invoiceStatus);
  const paymentStatus = getDisplayText(invoice.paymentStatusLabel ?? invoice.paymentStatus);
  const customerName = getDisplayText(invoice?.customer?.name) ?? "Customer";
  const customerPhone = getDisplayText(invoice?.customer?.phone) ?? "--";
  const customerEmail = getDisplayText(invoice?.customer?.email) ?? "--";
  const deliveryAddress = getDisplayText(invoice.deliveryAddressLabel ?? invoice.deliveryAddress) ?? "--";
  const paymentMethod = getDisplayText(invoice.paymentMethod) ?? "--";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-4 sm:px-6 lg:px-8 print-compact">
      <div className="no-print">
        <PageHeader title={title} description={description} action={action} />
      </div>

      <div id="invoice-print-root" className="print-compact">
        <Card className="invoice-card avoid-break w-full overflow-hidden rounded-[2rem] p-0">
          <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div>
                  <p className="text-3xl font-semibold text-foreground">{APP_NAME}</p>
                  <p className="text-sm text-muted-foreground">{t("qualityPartsTrustedService")}</p>
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <DetailField label={t("invoiceNumber")} value={invoice.invoiceNumber || "--"} />
                  <DetailField label={t("orderNumber")} value={invoice.orderNumber || "--"} />
                  <DetailField
                    label={t("invoiceDate")}
                    value={formatInvoiceDate(invoice.issuedAt, locale, true)}
                  />
                  <DetailField
                    label={t("printDate")}
                    value={formatInvoiceDate(invoice.printDate || invoice.issuedAt, locale, true)}
                  />
                </div>
              </div>

              <div className="space-y-4 lg:min-w-[260px]">
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatusField label={t("invoiceStatus")} value={invoiceStatus} align="end" />
                  <StatusField label={t("paymentStatus")} value={paymentStatus} align="end" />
                </div>
                {secondaryAction ? (
                  <div className="print-hidden no-print lg:flex lg:justify-end">{secondaryAction}</div>
                ) : null}
                {tertiaryAction ? (
                  <div className="print-hidden no-print lg:flex lg:justify-end">{tertiaryAction}</div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-5 border-b border-border px-5 py-5 sm:px-6 sm:py-5 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-3 avoid-break">
              <h2 className="text-lg font-semibold text-foreground">{t("customerInformation")}</h2>
              <dl className="grid gap-3 text-sm md:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">{t("name")}</dt>
                  <dd className="font-medium text-foreground">{customerName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("phone")}</dt>
                  <dd className="font-medium text-foreground">{customerPhone}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("email")}</dt>
                  <dd className="font-medium text-foreground">{customerEmail}</dd>
                </div>
              </dl>
            </div>

            <div className="space-y-3 avoid-break">
              <h2 className="text-lg font-semibold text-foreground">{t("deliveryAddress")}</h2>
              <p className="text-sm leading-6 text-foreground">{deliveryAddress}</p>
            </div>
          </div>

          {lines.length > 0 ? (
            <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-5 avoid-break">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-start text-muted-foreground">
                      <th className="pb-2 pe-4">{t("product")}</th>
                      <th className="pb-2 pe-4">{t("sku")}</th>
                      <th className="pb-2 pe-4">{t("quantity")}</th>
                      <th className="pb-2 pe-4">{t("unitPrice")}</th>
                      <th className="pb-2">{t("total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((item) => (
                      <tr key={item.id} className="border-b border-border/70 align-top last:border-b-0">
                        <td className="py-3 pe-4">
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">{item.productName}</p>
                            {item.description ? (
                              <p className="text-xs leading-5 text-muted-foreground">{item.description}</p>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-3 pe-4 text-muted-foreground">{item.sku || "--"}</td>
                        <td className="py-3 pe-4 text-foreground">{item.quantity ?? "--"}</td>
                        <td className="py-3 pe-4">
                          <InvoiceAmount amountMinor={item.unitPriceMinor} locale={locale} />
                        </td>
                        <td className="py-3">
                          <InvoiceAmount amountMinor={item.totalMinor} locale={locale} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="grid gap-5 px-5 py-5 sm:px-6 sm:py-5 lg:grid-cols-[1.2fr_280px]">
            <div className="space-y-4 avoid-break">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t("paymentSummary")}</h2>
                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">{t("paymentMethod")}</p>
                    <p className="font-medium text-foreground">{paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("paymentStatus")}</p>
                    <div className="pt-1">
                      <StatusBadge value={paymentStatus} />
                    </div>
                  </div>
                </div>
              </div>

              {invoice.termsNote ? (
                <div className="rounded-3xl border border-border bg-muted/30 p-4 avoid-break">
                  <p className="font-medium text-foreground">{t("termsAndConditions")}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{invoice.termsNote}</p>
                </div>
              ) : null}

              <div className="space-y-1">
                <p className="font-medium text-foreground">{t("thankYouForChoosingAdAutoParts")}</p>
                <p className="text-sm text-muted-foreground">{APP_NAME}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-border p-4 avoid-break">
              <div className="space-y-2 text-sm">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{t("subtotal")}</span>
                    <InvoiceAmount amountMinor={invoice.subtotalMinor} locale={locale} />
                  </div>
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
    </div>
  );
}
