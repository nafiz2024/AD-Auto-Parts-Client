import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default async function CheckoutPage({ searchParams }) {
  const params = await searchParams;
  const selectedProduct = params?.productId ?? params?.product ?? null;
  const selectedQty = params?.qty ?? "1";

  return (
    <Container className="space-y-8 py-10">
      <PageHeader
        title="Buy Now Checkout"
        description="Single-item checkout will be connected to the backend order flow in a later step. This placeholder confirms the homepage Buy Now action does not route to a cart system."
      />
      <Card>
        <CardHeader>
          <CardTitle>Checkout placeholder</CardTitle>
          <CardDescription>
            {selectedProduct
              ? `Selected product: ${selectedProduct} (qty: ${selectedQty})`
              : "A product identifier will appear here when Buy Now is triggered from a product card."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-muted-foreground">
          COD and manual advance payment exist in the business flow, but the real checkout UI has not been implemented yet.
        </CardContent>
      </Card>
    </Container>
  );
}
