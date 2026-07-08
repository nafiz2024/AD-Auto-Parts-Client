import { AdminProductEditPage } from "@/features/admin/admin-product-editor-page";

export default async function AdminProductEditRoutePage({ params }) {
  const { productId } = await params;

  return <AdminProductEditPage productId={productId} />;
}
