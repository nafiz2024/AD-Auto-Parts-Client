import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { PaginationShell } from "@/components/ui/pagination-shell";
import { ProductCardSkeleton } from "@/components/states/loading-states";

export default function ProductsPage() {
  return (
    <Container className="space-y-8 py-10">
      <PageHeader
        title="Products"
        description="This public products route now sits inside the storefront shell. Backend-connected listing and filters will arrive in the next step."
      />
      <Card>
        <CardHeader>
          <CardTitle>Listing placeholder</CardTitle>
          <CardDescription>
            Layout, spacing, and loading states are ready for the real product catalog.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </CardContent>
      </Card>
      <PaginationShell />
    </Container>
  );
}
