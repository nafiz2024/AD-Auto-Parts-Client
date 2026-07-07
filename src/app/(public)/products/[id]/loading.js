import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import {
  ProductCardSkeleton,
  ProductDetailsSkeleton,
} from "@/components/states/loading-states";

export default function ProductDetailLoading() {
  return (
    <div className="bg-[linear-gradient(180deg,#f8f7f4_0%,#ffffff_20%,#f8f7f4_100%)]">
      <Container className="space-y-8 py-8 pb-16 lg:py-10">
        <div className="h-4 w-64 animate-pulse rounded-full bg-muted" />
        <ProductDetailsSkeleton />
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="h-72 animate-pulse rounded-[2rem] bg-white" />
          <Card className="h-72 animate-pulse rounded-[2rem] bg-white" />
        </div>
        <Card className="space-y-4 rounded-[2rem]">
          <div className="h-8 w-44 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-full animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-4/5 animate-pulse rounded-full bg-muted" />
          <div className="h-64 rounded-[1.75rem] bg-muted/70" />
        </Card>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </Container>
    </div>
  );
}
