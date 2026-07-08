"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PriceDisplay } from "@/components/ui/price-display";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { getCustomerTrackOrder } from "@/features/orders/track-order-api";
import { BoxIcon, RefreshCcwIcon, WhatsappIcon } from "@/components/ui/icons";

function TimelineStep({ label, active }) {
  return (
    <div className="flex min-w-24 flex-col items-center gap-3 text-center">
      <div
        className={`flex size-12 items-center justify-center rounded-full border-2 ${
          active ? "border-success bg-success text-white" : "border-border bg-white text-muted-foreground"
        }`}
      >
        {active ? "✓" : "○"}
      </div>
      <span className={`text-sm font-medium ${active ? "text-success" : "text-muted-foreground"}`}>
        {label}
      </span>
    </div>
  );
}

export function TrackOrderPage({ initialOrderNumber = "" }) {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [attempted, setAttempted] = useState(false);

  function handleTrack(event) {
    event.preventDefault();
    setAttempted(true);
    setError(null);
    setResult(null);

    if (!orderNumber.trim()) {
      setError(new Error(t("orderNumberRequired")));
      return;
    }

    if (!isAuthenticated) {
      const unavailableError = new Error(
        t("trackingUnavailableDescription"),
      );
      setError(unavailableError);
      toast.warning(t("trackingUnavailable"), unavailableError.message);
      return;
    }

    startTransition(async () => {
      try {
        const order = await getCustomerTrackOrder(orderNumber.trim());
        setResult(order);
        toast.success(
          t("trackingInfoLoaded"),
          t("orderLoaded", { orderNumber: order.orderNumber ?? orderNumber }),
        );
      } catch (nextError) {
        setError(nextError);
        toast.apiError(nextError, t("couldNotFindMatchingOrder"));
      }
    });
  }

  return (
    <div className="bg-[linear-gradient(180deg,#f8f7f4_0%,#ffffff_20%,#f8f7f4_100%)]">
      <Container className="space-y-8 py-8 pb-16 lg:py-10">
        <div className="space-y-3 text-center">
          <p className="text-sm text-muted-foreground">
            {t("home")} / {t("trackOrder")}
          </p>
          <h1 className="text-5xl font-semibold tracking-tight text-foreground">{t("trackOrder")}</h1>
          <p className="text-lg text-muted-foreground">
            {t("trackOrderDescription")}
          </p>
        </div>

        <Card className="mx-auto max-w-5xl rounded-[2rem]">
          <form className="grid gap-5 lg:grid-cols-[1fr_1fr_auto]" onSubmit={handleTrack}>
            <div className="space-y-2">
              <Label htmlFor="track-order-number">{t("yourOrderNumber")}</Label>
              <Input
                id="track-order-number"
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                placeholder="AP-2026-000123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="track-phone">{t("phone")}</Label>
              <Input
                id="track-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+966 5X XXX XXXX"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full lg:w-auto" size="lg" disabled={isPending}>
                {isPending ? (
                  <>
                    <RefreshCcwIcon className="size-4 animate-spin" />
                    {t("loading")}
                  </>
                ) : (
                  t("trackOrder")
                )}
              </Button>
            </div>
          </form>
        </Card>

        {error ? (
          <Alert variant="warning" title={t("failedToLoad")}>
            {error.message}
          </Alert>
        ) : null}

        {!result && attempted && !error ? (
          <EmptyState
            icon={BoxIcon}
            title={t("noTrackingDetailsYet")}
            description={t("trackingDetailsAppearHere")}
          />
        ) : null}

        {result ? (
          <Card className="space-y-6 rounded-[2rem]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold text-foreground">{t("orderFound")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("orderFoundDescription")}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">{result.createdAt ?? t("statusUpdatedFromBackend")}</p>
            </div>

            <div className="grid gap-4 rounded-[1.75rem] border border-border/70 bg-white p-5 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("yourOrderNumber")}</p>
                <p className="font-semibold text-foreground">{result.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("paymentMethod")}</p>
                <p className="font-semibold text-foreground">{result.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("total")}</p>
                {result.totalMinor !== null ? (
                  <PriceDisplay amountMinor={result.totalMinor} className="text-2xl" />
                ) : (
                  <p className="font-semibold text-foreground">—</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("shipmentStatus")}</p>
                <p className="font-semibold text-foreground">{result.shipmentStatus}</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-6 overflow-x-auto rounded-[1.75rem] border border-border/70 bg-white px-5 py-6">
              {[t("placed"), t("confirmed"), t("processing"), t("shipped"), t("delivered")].map((label) => (
                <TimelineStep
                  key={label}
                  label={label}
                  active={[
                    result.status,
                    result.shipmentStatus,
                    result.paymentStatus,
                  ]
                    .join(" ")
                    .toLowerCase()
                    .includes(label.toLowerCase())}
                />
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <Card className="rounded-[1.75rem]">
                <h3 className="text-lg font-semibold text-foreground">{t("productSummary")}</h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  {result.productName ?? t("singleItemOrder")}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("quantity")}: {result.quantity}
                </p>
                {result.itemPriceMinor !== null ? (
                  <PriceDisplay amountMinor={result.itemPriceMinor} className="mt-3 text-2xl" />
                ) : null}
              </Card>
              <Card className="rounded-[1.75rem]">
                <h3 className="text-lg font-semibold text-foreground">{t("shippingInformation")}</h3>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <p>{t("courier")}: {result.courierName ?? t("awaitingAssignment")}</p>
                  <p>{t("trackingNumber")}: {result.trackingNumber ?? t("pending")}</p>
                  <p>{t("estimatedDelivery")}: {result.estimatedDelivery ?? t("pending")}</p>
                </div>
              </Card>
            </div>

            <a
              href={`https://wa.me/966543216789?text=${encodeURIComponent(
                t("trackingWhatsappHelp", { orderNumber: result.orderNumber }),
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg">
                <WhatsappIcon className="size-5 text-[#25d366]" />
                {t("askOnWhatsapp")}
              </Button>
            </a>
          </Card>
        ) : null}
      </Container>
    </div>
  );
}
