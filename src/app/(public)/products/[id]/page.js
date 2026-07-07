import { notFound } from "next/navigation";
import { APP_NAME } from "@/config/env";
import { ProductDetailPage } from "@/features/products/product-detail-page";
import { getProductDetailPageData } from "@/features/products/product-detail-api";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;

  try {
    const data = await getProductDetailPageData(id);

    if (!data.product) {
      return {
        title: `Product Details | ${APP_NAME}`,
        description: "Used auto parts product details.",
      };
    }

    return {
      title: `${data.product.name} | ${APP_NAME}`,
      description:
        data.product.shortDescription ??
        data.product.description ??
        "Used auto part details and compatibility summary.",
    };
  } catch {
    return {
      title: `Product Details | ${APP_NAME}`,
      description: "Used auto parts product details.",
    };
  }
}

export default async function ProductDetailPageRoute({ params }) {
  const { id } = await params;
  const data = await getProductDetailPageData(id);

  if (data.notFound || !data.product) {
    notFound();
  }

  return <ProductDetailPage data={data} />;
}
