import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/features/listing/listing-page";

export function RelatedProducts({ relatedProducts }) {
  if (relatedProducts.error) {
    return (
      <Card className="rounded-[2rem]">
        <h2 className="text-2xl font-semibold text-foreground">Related Products</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          We couldn&apos;t load related products right now. Please refresh and try again.
        </p>
      </Card>
    );
  }

  if (!relatedProducts.items.length) {
    return (
      <EmptyState
        title="No related products"
        description="Related part suggestions are not available for this product yet."
      />
    );
  }

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">Related Products</h2>
        <p className="text-sm text-muted-foreground">
          Similar inspected used parts that keep the single-item Buy Now flow.
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
