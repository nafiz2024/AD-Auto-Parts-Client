"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PriceDisplay } from "@/components/ui/price-display";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { routes } from "@/constants/routes";
import { buildQueryString } from "@/lib/api/query";
import { getStockLabel } from "@/lib/formatters/product-labels";
import { BagIcon, ExternalLinkIcon, WhatsappIcon } from "@/components/ui/icons";

function RatingStars({ ratingAverage, reviewCount }) {
  const { t } = useLanguage();

  if (!ratingAverage) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <div className="flex items-center gap-1 text-amber-400">
        {Array.from({ length: 5 }).map((_, index) => (
          <span key={index}>{index < Math.round(ratingAverage) ? "★" : "☆"}</span>
        ))}
      </div>
      <span className="font-medium text-foreground">
        {ratingAverage.toFixed(1)}
      </span>
      <span className="text-muted-foreground">
        {t("reviewsCount", {
          count: reviewCount,
          suffix: reviewCount === 1 ? "" : "s",
        })}
      </span>
    </div>
  );
}

function InfoMiniCard({ title, value }) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function ProductInfoPanel({ product }) {
  const { t, getLocalizedField } = useLanguage();
  const toast = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const localizedProductName = getLocalizedField(product, "name") || product.name;
  const stockLabel = getStockLabel(t, product.stockCode ?? product.stockLabel, product.stockLabel);
  const checkoutHref = `${routes.public.checkout}${buildQueryString({
    productId: product.slug ?? product.id,
    qty: 1,
  })}`;
  const whatsappHref = `https://wa.me/${product.whatsappNumber}?text=${encodeURIComponent(
    t("confirmCompatibilityMessage", {
      productName: localizedProductName,
      oemNumber: product.oemNumber ? ` (OEM: ${product.oemNumber})` : "",
    }),
  )}`;

  function handleBuyNow() {
    if (!product.isPurchasable) {
      toast.error(
        product.isSold ? t("sold") : t("outOfStock"),
        t("partUnavailableImmediateCheckout"),
      );
      return;
    }

    startTransition(() => {
      router.push(checkoutHref);
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        {product.categoryName ? (
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-red">
            {product.categoryName}
          </p>
        ) : null}

        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {localizedProductName}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {product.sku ? <span>{t("sku")}: {product.sku}</span> : null}
            {product.partNumber ? <span>{t("partNumber")}: {product.partNumber}</span> : null}
            {product.oemNumber ? <span>{t("oemNumber")}: {product.oemNumber}</span> : null}
          </div>
          <RatingStars ratingAverage={product.ratingAverage} reviewCount={product.reviewCount} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PriceDisplay amountMinor={product.priceMinor} className="text-4xl" />
          {product.compareAtMinor ? (
            <span className="text-lg text-muted-foreground line-through">
              <PriceDisplay
                amountMinor={product.compareAtMinor}
                className="font-normal text-muted-foreground"
              />
            </span>
          ) : null}
          {product.discountLabel ? <Badge variant="error">-{product.discountLabel}</Badge> : null}
        </div>

        {product.shortDescription ? (
          <p className="text-base leading-8 text-muted-foreground">{product.shortDescription}</p>
        ) : null}
      </div>

      {product.isLimitedStock ? (
        <Badge variant="warning">
          {product.availableQuantity === 1
            ? t("onlyOneUnitAvailable")
            : product.availableQuantity
              ? t("onlyUnitsAvailable", { count: product.availableQuantity })
              : t("limitedStock")}
        </Badge>
      ) : null}
      {!product.isPurchasable ? (
        <Badge variant="error">{product.isSold ? t("sold") : t("outOfStock")}</Badge>
      ) : null}

      <Card className="space-y-5 rounded-[2rem]">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">{t("vehicleCompatibility")}</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            {product.compatibility.vehicleBrand || product.compatibility.model || product.compatibility.yearRange
              ? `${product.compatibility.vehicleBrand ?? t("vehicle")} ${
                  product.compatibility.model ?? ""
                } ${product.compatibility.yearRange ?? ""}`.trim()
              : t("compatibilityDetailsWillAppear")}
          </p>
        </div>
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex">
          <Button className="bg-[#25d366] hover:brightness-95">
            <WhatsappIcon className="size-5" />
            {t("confirmCompatibilityOnWhatsapp")}
          </Button>
        </a>
      </Card>

      <Card className="space-y-4 rounded-[2rem]">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t("quantity")}
          </p>
          <div className="inline-flex items-center gap-3 rounded-full border border-border bg-white px-3 py-2">
            <button type="button" className="text-xl text-muted-foreground" disabled>
              -
            </button>
            <span className="min-w-6 text-center font-semibold text-foreground">1</span>
            <button type="button" className="text-xl text-muted-foreground" disabled>
              +
            </button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
          <Button size="lg" onClick={handleBuyNow} disabled={!product.isPurchasable || isPending}>
            <BagIcon className="size-5" />
            {isPending ? t("openingCheckout") : t("buyNow")}
          </Button>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex">
            <Button variant="outline" size="lg" className="w-full">
              <WhatsappIcon className="size-5" />
              {t("askOnWhatsapp")}
            </Button>
          </a>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <InfoMiniCard title={t("delivery")} value={t("deliveryTimingConfirmedAtCheckout")} />
        <InfoMiniCard title={t("paymentMethod")} value={t("finalTotalsPaymentOptionsBackend")} />
        <InfoMiniCard
          title={t("stock")}
          value={product.isPurchasable ? stockLabel : t("currentlyUnavailable")}
        />
      </div>

      <div className="rounded-[1.75rem] border border-border/70 bg-white px-5 py-4 text-sm text-muted-foreground">
        <a
          href={checkoutHref}
          className="inline-flex items-center gap-2 font-medium text-brand-red transition hover:text-brand-red-strong"
        >
          <ExternalLinkIcon className="size-4" />
          {t("checkoutLinkPreview")}
        </a>
        <p className="mt-2 leading-7">
          {t("buyNowCheckoutControlled")}
        </p>
      </div>
    </div>
  );
}
