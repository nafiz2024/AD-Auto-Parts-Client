"use client";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useLanguage } from "@/hooks/use-language";
import { ProductCard } from "@/features/listing/listing-page";

export function RelatedProducts({ relatedProducts }) {
  const { t } = useLanguage();

  if (relatedProducts.error) {
    return (
      <Card className="rounded-[2rem]">
        <h2 className="text-2xl font-semibold text-foreground">{t("relatedProducts")}</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {t("relatedProductsLoadError")}
        </p>
      </Card>
    );
  }

  if (!relatedProducts.items.length) {
    return (
      <EmptyState
        title={t("noRelatedProducts")}
        description={t("noRelatedProductsDescription")}
      />
    );
  }

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">{t("relatedProducts")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("relatedProductsDescription")}
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {relatedProducts.items.map((product) => (
          <ProductCard key={product.id} product={product} view="grid" />
        ))}
      </div>
    </section>
  );
}
