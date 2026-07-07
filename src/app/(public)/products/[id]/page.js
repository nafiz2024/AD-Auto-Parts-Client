import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { routes } from "@/constants/routes";
import { buildQueryString } from "@/lib/api/query";

export default async function ProductDetailPlaceholderPage({ params }) {
  const { id } = await params;

  return (
    <Container className="space-y-8 py-10">
      <PageHeader
        title="Product Details"
        description="The product details page will connect to the public product detail endpoint in a later step."
      />
      <Card>
        <CardHeader>
          <CardTitle>Placeholder for product: {id}</CardTitle>
          <CardDescription>
            This route exists so homepage product cards can use a product-detail-first flow instead of a cart flow.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href={routes.public.products}>
            <Button variant="outline">Back to Products</Button>
          </Link>
          <Link href={`${routes.public.checkout}${buildQueryString({ product: id })}`}>
            <Button>Buy Now</Button>
          </Link>
        </CardContent>
      </Card>
    </Container>
  );
}
