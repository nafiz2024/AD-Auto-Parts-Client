import { Container } from "@/components/ui/container";
import { ProductDetailsSkeleton } from "@/components/states/loading-states";

export default function CheckoutLoading() {
  return (
    <Container className="py-10">
      <ProductDetailsSkeleton />
    </Container>
  );
}
