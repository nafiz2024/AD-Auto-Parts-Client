"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PriceDisplay } from "@/components/ui/price-display";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ProductDetailsSkeleton } from "@/components/states/loading-states";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { routes } from "@/constants/routes";
import { getDeliveryEstimate, getDeliveryZones, getCheckoutProduct, submitCheckout } from "@/features/checkout/checkout-api";
import { buildQueryString } from "@/lib/api/query";
import { ArrowLeftIcon, BagIcon, RefreshCcwIcon, ShieldIcon, WhatsappIcon } from "@/components/ui/icons";

function createInitialForm(zoneId = "") {
  return {
    fullName: "",
    email: "",
    phone: "",
    city: zoneId,
    area: "",
    streetAddress: "",
    buildingNo: "",
    postalCode: "",
    additionalDirections: "",
    paymentMethod: "COD",
    orderNote: "",
    termsAccepted: false,
  };
}

function createPayloadSignature(payload) {
  return JSON.stringify(payload);
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getFieldError(fieldErrors, field) {
  const value = fieldErrors[field];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function mapEstimatePayload(productId, qty, form) {
  return {
    productId,
    qty,
    city: form.city,
    area: form.area,
    zoneId: form.city,
  };
}

function PaymentMethodCard({ id, title, description, selected, onSelect, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      disabled={disabled}
      className={`rounded-[1.6rem] border px-4 py-4 text-start transition ${
        selected
          ? "border-brand-navy bg-brand-navy/[0.04] shadow-soft"
          : "border-border bg-white hover:border-brand-navy/40"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </button>
  );
}

export function CheckoutPage({
  initialProductId,
  initialQty = 1,
}) {
  const { t, getLocalizedField } = useLanguage();
  const toast = useToast();
  const router = useRouter();
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [productState, setProductState] = useState({
    status: initialProductId ? "loading" : "empty",
    product: null,
    error: null,
  });
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState(createInitialForm());
  const [fieldErrors, setFieldErrors] = useState({});
  const [estimateState, setEstimateState] = useState({
    status: "idle",
    data: null,
    error: null,
  });
  const [checkoutError, setCheckoutError] = useState(null);
  const [idempotencyState, setIdempotencyState] = useState({
    key: null,
    signature: null,
  });

  useEffect(() => {
    let mounted = true;

    getDeliveryZones().then((items) => {
      if (mounted) {
        setZones(items);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!initialProductId) {
      return undefined;
    }

    let mounted = true;

    getCheckoutProduct(initialProductId)
      .then((product) => {
        if (!mounted) {
          return;
        }

        setProductState({
          status: product.isPurchasable ? "ready" : "unavailable",
          product,
          error: null,
        });
      })
      .catch((error) => {
        if (!mounted) {
          return;
        }

        setProductState({ status: "error", product: null, error });
      });

    return () => {
      mounted = false;
    };
  }, [initialProductId]);

  const estimatedTotalMinor = useMemo(() => {
    if (!productState.product) {
      return null;
    }

    if (estimateState.data?.feeMinor === null || estimateState.data?.feeMinor === undefined) {
      return productState.product.priceMinor;
    }

    return productState.product.priceMinor + estimateState.data.feeMinor;
  }, [estimateState.data, productState.product]);

  function updateFormField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleEstimateDelivery() {
    if (!productState.product) {
      return;
    }

    setEstimateState({ status: "loading", data: null, error: null });

    try {
      const estimate = await getDeliveryEstimate(
        mapEstimatePayload(productState.product.id, initialQty, form),
      );
      setEstimateState({ status: "ready", data: estimate, error: null });
      toast.success(t("deliveryEstimateUpdated"), t("deliveryEstimateRefreshed"));
    } catch (error) {
      setEstimateState({ status: "error", data: null, error });
      toast.warning(t("estimateUnavailable"), t("estimateUnavailableDescription"));
    }
  }

  function validateForm() {
    const nextErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Phone is required.";
    }

    if (!form.city.trim()) {
      nextErrors.city = "City is required.";
    }

    if (!form.area.trim()) {
      nextErrors.area = "Area is required.";
    }

    if (!form.streetAddress.trim()) {
      nextErrors.streetAddress = "Street address is required.";
    }

    if (!form.termsAccepted) {
      nextErrors.termsAccepted = "Please confirm before placing the order.";
    }

    return nextErrors;
  }

  function buildCheckoutPayload() {
    return {
      productId: productState.product.id,
      quantity: initialQty,
      contact: {
        fullName: form.fullName,
        email: form.email || undefined,
        phone: form.phone,
      },
      shippingAddress: {
        city: form.city,
        area: form.area,
        streetAddress: form.streetAddress,
        buildingNo: form.buildingNo || undefined,
        postalCode: form.postalCode || undefined,
        additionalDirections: form.additionalDirections || undefined,
      },
      delivery: {
        zoneId: form.city,
        area: form.area,
      },
      paymentMethod: form.paymentMethod,
      orderNote: form.orderNote || undefined,
      termsAccepted: form.termsAccepted,
    };
  }

  function getIdempotencyKeyForPayload(payload) {
    const signature = createPayloadSignature(payload);

    if (idempotencyState.signature === signature && idempotencyState.key) {
      return idempotencyState.key;
    }

    const nextKey = createIdempotencyKey();
    setIdempotencyState({ signature, key: nextKey });
    return nextKey;
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!productState.product) {
      return;
    }

    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      toast.error(t("failedToPlaceOrder"), t("checkInfoAndTryAgain"));
      return;
    }

    const payload = buildCheckoutPayload();
    const idempotencyKey = getIdempotencyKeyForPayload(payload);
    setCheckoutError(null);

    startSubmitTransition(async () => {
      try {
        const order = await submitCheckout(payload, idempotencyKey);
        toast.success(t("orderPlacedSuccessfully"), `Order ${order.orderNumber ?? ""} was created.`);
        const search = buildQueryString({
          orderNumber: order.orderNumber,
          paymentMethod: order.paymentMethod,
          status: order.status,
          totalMinor: order.totalMinor,
          estimatedDelivery: order.estimatedDelivery,
          productName: productState.product.name,
        });
        router.push(`${routes.public.checkoutSuccess}${search}`);
      } catch (error) {
        setFieldErrors(error?.fieldErrors ?? {});
        setCheckoutError(error);
        toast.apiError(error, t("failedToPlaceOrder"));
      }
    });
  }

  if (!initialProductId) {
    return (
      <Container className="py-12">
        <EmptyState
          title={t("noProductSelected")}
          description={t("noProductSelectedDescription")}
          actionLabel={t("backToShop")}
          actionHref={routes.public.products}
        />
      </Container>
    );
  }

  if (productState.status === "loading") {
    return (
      <div className="bg-[linear-gradient(180deg,#f8f7f4_0%,#ffffff_20%,#f8f7f4_100%)]">
        <Container className="space-y-8 py-8 pb-16 lg:py-10">
          <ProductDetailsSkeleton />
        </Container>
      </div>
    );
  }

  if (productState.status === "error") {
    return (
      <Container className="py-12">
        <EmptyState
          title={t("failedToLoad")}
          description={t("selectedProductCheckoutLoadError")}
          actionLabel={t("backToShop")}
          actionHref={routes.public.products}
        />
      </Container>
    );
  }

  if (productState.status === "unavailable") {
    return (
      <Container className="py-12">
        <EmptyState
          title={t("productUnavailable")}
          description={t("productUnavailableCheckout")}
          actionLabel={t("backToShop")}
          actionHref={routes.public.products}
        />
      </Container>
    );
  }

  const product = productState.product;
  const localizedProductName = getLocalizedField(product, "name") || product.name;

  return (
    <div className="bg-[linear-gradient(180deg,#f8f7f4_0%,#ffffff_20%,#f8f7f4_100%)]">
      <Container className="space-y-8 py-8 pb-16 lg:py-10">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("home")} / {t("checkout")}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            {t("checkout")}
          </h1>
          <p className="text-base text-muted-foreground">
            {t("singleItemCheckoutDescription")}
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Card className="space-y-5 rounded-[2rem]">
              <div className="rounded-[1.75rem] border border-border/70 bg-white p-4">
                <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center">
                  <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-white">
                    {product.images[0]?.url ? (
                      <img
                        src={product.images[0].url}
                        alt={localizedProductName}
                        className="h-28 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-28 items-center justify-center text-sm text-muted-foreground">
                        {t("noImage")}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-foreground">{localizedProductName}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.shortDescription ?? product.compatibility.yearRange ?? ""}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                        {product.stockLabel}
                      </span>
                      <span className="inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600">
                        {product.conditionSummary.label}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 text-end">
                    <PriceDisplay amountMinor={product.priceMinor} className="text-2xl" />
                    <p className="text-sm text-muted-foreground">
                      {t("quantity")}: {initialQty}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("fullName")}</Label>
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={(event) => updateFormField("fullName", event.target.value)}
                    placeholder={t("enterFullName")}
                  />
                  {getFieldError(fieldErrors, "fullName") ? (
                    <p className="text-sm text-error">{getFieldError(fieldErrors, "fullName")}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("phone")}</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(event) => updateFormField("phone", event.target.value)}
                    placeholder="+966 5X XXX XXXX"
                  />
                  {getFieldError(fieldErrors, "phone") ? (
                    <p className="text-sm text-error">{getFieldError(fieldErrors, "phone")}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  value={form.email}
                  onChange={(event) => updateFormField("email", event.target.value)}
                  placeholder="name@example.com"
                />
                {getFieldError(fieldErrors, "email") ? (
                  <p className="text-sm text-error">{getFieldError(fieldErrors, "email")}</p>
                ) : null}
              </div>
            </Card>

            <Card className="space-y-5 rounded-[2rem]">
              <h2 className="text-2xl font-semibold text-foreground">{t("shippingAddress")}</h2>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">{t("city")}</Label>
                  <Select
                    id="city"
                    value={form.city}
                    onChange={(event) => updateFormField("city", event.target.value)}
                  >
                    <option value="">{t("selectCity")}</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </Select>
                  {getFieldError(fieldErrors, "city") ? (
                    <p className="text-sm text-error">{getFieldError(fieldErrors, "city")}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">{t("area")}</Label>
                  <Input
                    id="area"
                    value={form.area}
                    onChange={(event) => updateFormField("area", event.target.value)}
                    placeholder={t("districtOrArea")}
                  />
                  {getFieldError(fieldErrors, "area") ? (
                    <p className="text-sm text-error">{getFieldError(fieldErrors, "area")}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="streetAddress">{t("streetAddress")}</Label>
                <Input
                  id="streetAddress"
                    value={form.streetAddress}
                    onChange={(event) => updateFormField("streetAddress", event.target.value)}
                    placeholder={t("streetNeighborhoodUnitDetails")}
                  />
                {getFieldError(fieldErrors, "streetAddress") ? (
                  <p className="text-sm text-error">{getFieldError(fieldErrors, "streetAddress")}</p>
                ) : null}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="buildingNo">{t("buildingNo")}</Label>
                  <Input
                    id="buildingNo"
                    value={form.buildingNo}
                    onChange={(event) => updateFormField("buildingNo", event.target.value)}
                    placeholder={t("optional")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">{t("postalCode")}</Label>
                  <Input
                    id="postalCode"
                    value={form.postalCode}
                    onChange={(event) => updateFormField("postalCode", event.target.value)}
                    placeholder={t("optional")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalDirections">{t("additionalDirections")}</Label>
                <Textarea
                  id="additionalDirections"
                  className="min-h-24"
                  value={form.additionalDirections}
                  onChange={(event) => updateFormField("additionalDirections", event.target.value)}
                  placeholder={t("deliveryNotesForDriver")}
                />
              </div>

              <div className="rounded-[1.5rem] border border-border/70 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{t("deliveryMethod")}</p>
                    <p className="text-sm text-muted-foreground">
                      {estimateState.data?.estimatedDelivery ?? t("backendDeliveryEstimateInstruction")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleEstimateDelivery}
                    disabled={!form.city || !form.area || estimateState.status === "loading"}
                  >
                    {estimateState.status === "loading" ? (
                      <>
                        <RefreshCcwIcon className="size-4 animate-spin" />
                        {t("loading")}
                      </>
                    ) : (
                      t("updateEstimate")
                    )}
                  </Button>
                </div>
                {estimateState.status === "error" ? (
                  <Alert variant="warning" className="mt-4" title={t("estimateUnavailable")}>
                    {t("estimateUnavailablePricingDescription")}
                  </Alert>
                ) : null}
              </div>
            </Card>

            <Card className="space-y-5 rounded-[2rem]">
              <h2 className="text-2xl font-semibold text-foreground">{t("paymentMethod")}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <PaymentMethodCard
                  id="COD"
                  title={t("cashOnDelivery")}
                  description={t("payWhenReceive")}
                  selected={form.paymentMethod === "COD"}
                  onSelect={(value) => updateFormField("paymentMethod", value)}
                />
                <PaymentMethodCard
                  id="MANUAL_ADVANCE"
                  title={t("manualAdvancePayment")}
                  description={t("submitPaymentProofAfterOrder")}
                  selected={form.paymentMethod === "MANUAL_ADVANCE"}
                  onSelect={(value) => updateFormField("paymentMethod", value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderNote">{t("orderNote")}</Label>
                <Textarea
                  id="orderNote"
                  className="min-h-24"
                  value={form.orderNote}
                  onChange={(event) => updateFormField("orderNote", event.target.value)}
                  placeholder={t("optionalDeliveryCompatibilityNote")}
                />
              </div>

              <label className="flex items-start gap-3 rounded-[1.25rem] border border-border/70 bg-white px-4 py-4">
                <Checkbox
                  checked={form.termsAccepted}
                  onChange={(event) => updateFormField("termsAccepted", event.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm leading-6 text-foreground">
                  {t("confirmSingleProductOnly")}
                </span>
              </label>
              {getFieldError(fieldErrors, "termsAccepted") ? (
                <p className="text-sm text-error">{getFieldError(fieldErrors, "termsAccepted")}</p>
              ) : null}
            </Card>
          </form>

          <aside className="space-y-5">
            <Card className="space-y-5 rounded-[2rem] xl:sticky xl:top-28">
              <h2 className="text-2xl font-semibold text-foreground">{t("orderSummary")}</h2>
              <div className="rounded-[1.5rem] border border-border/70 bg-white p-4">
                <div className="grid gap-4 sm:grid-cols-[72px_minmax(0,1fr)] sm:items-center">
                  <div className="overflow-hidden rounded-[1rem] border border-border/70 bg-white">
                    {product.images[0]?.url ? (
                      <img
                        src={product.images[0].url}
                        alt={localizedProductName}
                        className="h-18 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-18 items-center justify-center text-xs text-muted-foreground">
                        {t("noImage")}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{localizedProductName}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("quantity")}: {initialQty}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">{t("itemTotal")}</span>
                  <PriceDisplay amountMinor={product.priceMinor} />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">{t("deliveryFee")}</span>
                  {estimateState.status === "ready" && estimateState.data?.feeMinor !== null ? (
                    <PriceDisplay amountMinor={estimateState.data.feeMinor} />
                  ) : (
                    <span className="text-muted-foreground">{t("pendingEstimate")}</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-border pt-3 text-lg font-semibold text-foreground">
                  <span>{t("total")}</span>
                  {estimatedTotalMinor !== null ? (
                    <PriceDisplay amountMinor={estimatedTotalMinor} className="text-2xl" />
                  ) : (
                    <span>—</span>
                  )}
                </div>
              </div>

              <Alert variant="warning" title={t("finalTotalServerConfirmed")}>
                {t("finalTotalInformationalDescription")}
              </Alert>

              {checkoutError ? (
                <Alert variant="error" title={t("failedToPlaceOrder")}>
                  {checkoutError.message ?? t("checkInfoAndTryAgain")}
                </Alert>
              ) : null}

              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                <BagIcon className="size-5" />
                {isSubmitting ? t("placingOrder") : t("placeOrder")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push(routes.public.productDetail(product.slug ?? product.id))}
              >
                <ArrowLeftIcon className="size-5" />
                {t("cancelAndGoBack")}
              </Button>

              <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
                <div className="flex items-center gap-3">
                  <ShieldIcon className="size-5" />
                  <span>{t("yourInformationSafeSecure")}</span>
                </div>
              </div>

              <a
                href={`https://wa.me/966543216789?text=${encodeURIComponent(
                  t("checkoutWhatsappHelp", { productName: localizedProductName }),
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full"
              >
                <Button variant="outline" className="w-full">
                  <WhatsappIcon className="size-5 text-[#25d366]" />
                  {t("askOnWhatsapp")}
                </Button>
              </a>
            </Card>
          </aside>
        </div>
      </Container>
    </div>
  );
}
