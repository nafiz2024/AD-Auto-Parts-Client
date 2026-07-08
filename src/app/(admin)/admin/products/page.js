import { Suspense } from "react";

import { PageLoadingState } from "@/components/states/loading-states";
import { AdminProductsPage } from "@/features/admin/admin-products-page";

export default function AdminProductsRoutePage() {
  return (
    <Suspense fallback={<PageLoadingState label="Loading products" />}>
      <AdminProductsPage />
    </Suspense>
  );
}
