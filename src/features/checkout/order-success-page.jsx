"use client";

import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { PriceDisplay } from "@/components/ui/price-display";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { routes } from "@/constants/routes";
import { CheckIcon, ExternalLinkIcon, WhatsappIcon } from "@/components/ui/icons";

function SuccessRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/70 py-4 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end font-semibold text-foreground">{value || "—"}</span>
    </div>
  );
}

export function OrderSuccessPage({ searchParams }) {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const orderNumber = searchParams.orderNumber ?? null;
  const paymentMethod = searchParams.paymentMethod ?? null;
  const status = searchParams.status ?? "Placed";
  const totalMinor = searchParams.totalMinor ? Number(searchParams.totalMinor) : null;
  const estimatedDelivery = searchParams.estimatedDelivery ?? null;
  const trackHref = orderNumber
    ? `${routes.public.trackOrder}${new URLSearchParams({ orderNumber }).toString() ? `?orderNumber=${encodeURIComponent(orderNumber)}` : ""}`
    : routes.public.trackOrder;
  const viewOrderHref = orderNumber && isAuthenticated
    ? routes.customer.accountOrderDetail(orderNumber)
    : trackHref;

  return (
    <div className="bg-[linear-gradient(180deg,#f8f7f4_0%,#ffffff_20%,#f8f7f4_100%)]">
      <Container className="py-12">
        <Card className="mx-auto max-w-4xl space-y-6 rounded-[2.5rem]">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-success text-white shadow-soft">
              <CheckIcon className="size-12" />
            </div>
            <h1 className="text-5xl font-semibold tracking-tight text-foreground">
              {t("orderPlacedSuccessfully")}
            </h1>
            <p className="text-lg text-muted-foreground">
              Thank you. Your single-item order has been submitted to the backend successfully.
            </p>
          </div>

          <div className="rounded-[2rem] border border-border/70 bg-white px-6 py-2">
            <SuccessRow label={t("yourOrderNumber")} value={orderNumber} />
            <SuccessRow label={t("paymentMethod")} value={paymentMethod} />
            <SuccessRow label={t("orders")} value={status} />
            <SuccessRow
              label={t("total")}
              value={totalMinor !== null ? <PriceDisplay amountMinor={totalMinor} className="text-3xl" /> : "Confirmed by backend"}
            />
            <SuccessRow label={t("estimatedDelivery")} value={estimatedDelivery} />
          </div>

          {paymentMethod === "MANUAL_ADVANCE" ? (
            <Alert variant="warning" title={t("manualAdvancePayment")}>
              {t("submitPaymentProofAfterOrder")}
            </Alert>
          ) : (
            <Alert variant="success" title={t("cashOnDelivery")}>
              {t("payWhenReceive")}
            </Alert>
          )}

          <div className="grid gap-3">
            <a href={viewOrderHref}>
              <Button className="w-full" size="lg">
                <ExternalLinkIcon className="size-5" />
                {isAuthenticated ? t("viewOrder") : t("trackOrder")}
              </Button>
            </a>
            <a href={routes.public.shop}>
              <Button variant="outline" className="w-full" size="lg">
                {t("continueShopping")}
              </Button>
            </a>
            <a
              href={`https://wa.me/966543216789?text=${encodeURIComponent(`Hi, I need help with order ${orderNumber ?? ""}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full" size="lg">
                <WhatsappIcon className="size-5 text-[#25d366]" />
                {t("askOnWhatsapp")}
              </Button>
            </a>
          </div>
        </Card>
      </Container>
    </div>
  );
}
