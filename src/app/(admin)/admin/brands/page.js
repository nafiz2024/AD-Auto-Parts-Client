import { Suspense } from "react";

import { PageLoadingState } from "@/components/states/loading-states";
import { AdminBrandPage } from "@/features/admin/brands/brand-page";

export default function AdminBrandsRoutePage() {
  return (
    <Suspense fallback={<PageLoadingState title="Loading brands" />}>
      <AdminBrandPage />
    </Suspense>
  );
}
