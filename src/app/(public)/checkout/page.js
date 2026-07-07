import { CheckoutPage as CheckoutFeaturePage } from "@/features/checkout/checkout-page";

export default async function CheckoutRoute({ searchParams }) {
  const params = await searchParams;
  const selectedProduct = params?.productId ?? params?.product ?? null;
  const selectedQty = Number.parseInt(params?.qty ?? "1", 10);

  return (
    <CheckoutFeaturePage
      initialProductId={selectedProduct}
      initialQty={Number.isFinite(selectedQty) && selectedQty > 0 ? selectedQty : 1}
    />
  );
}
