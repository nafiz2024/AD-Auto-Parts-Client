"use client";

import { Container } from "@/components/ui/container";
import { useLanguage } from "@/hooks/use-language";
import { ProductGallery } from "@/features/products/components/product-gallery";
import { ProductInfoPanel } from "@/features/products/components/product-info-panel";
import { CompatibilitySummary } from "@/features/products/components/compatibility-summary";
import { ConditionSummary } from "@/features/products/components/condition-summary";
import { ProductTabs } from "@/features/products/components/product-tabs";
import { RelatedProducts } from "@/features/products/components/related-products";
import { getConditionLabel, getStockLabel } from "@/lib/formatters/product-labels";

function Breadcrumbs({ items }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center gap-2">
          {item.href ? (
            <a href={item.href} className="transition hover:text-brand-red">
              {item.label}
            </a>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
          {index < items.length - 1 ? <span>/</span> : null}
        </div>
      ))}
    </div>
  );
}

export function ProductDetailPage({ data }) {
  const { t, getLocalizedField } = useLanguage();
  const { product, relatedProducts, reviews, questions } = data;
  const conditionLabel = getConditionLabel(
    t,
    product.conditionSummary?.code ?? product.conditionSummary?.label,
    product.conditionSummary?.label,
  );
  const stockLabel = getStockLabel(t, product.stockCode ?? product.stockLabel, product.stockLabel);
  const whatsappHref = `https://wa.me/${product.whatsappNumber}?text=${encodeURIComponent(
    t("productWhatsappQuestion", {
      productName: getLocalizedField(product, "name") || product.name,
    }),
  )}`;
  const breadcrumbItems = [
    { label: t("home"), href: "/" },
    { label: t("products"), href: "/products" },
    ...product.breadcrumbs.slice(2),
  ];

  return (
    <div className="bg-[linear-gradient(180deg,#f8f7f4_0%,#ffffff_20%,#f8f7f4_100%)]">
      <Container className="space-y-8 py-8 pb-16 lg:py-10">
        <Breadcrumbs items={breadcrumbItems} />

        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <ProductGallery
            title={getLocalizedField(product, "name") || product.name}
            images={product.images}
            conditionLabel={conditionLabel}
            stockLabel={stockLabel}
          />
          <ProductInfoPanel product={product} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <ConditionSummary conditionSummary={product.conditionSummary} />
          <CompatibilitySummary
            compatibility={product.compatibility}
            whatsappHref={whatsappHref}
            confirmLabel={t("confirmCompatibilityOnWhatsapp")}
            disclaimer={t("confirmCompatibilityDisclaimer")}
          />
        </section>

        <ProductTabs
          productId={product.id}
          productName={getLocalizedField(product, "name") || product.name}
          description={product.description}
          specifications={product.specifications}
          compatibility={product.compatibility}
          deliveryNotes={product.deliveryNotes}
          returnNotes={product.returnNotes}
          reviews={reviews}
          questions={questions}
        />

        <RelatedProducts relatedProducts={relatedProducts} />
      </Container>
    </div>
  );
}
