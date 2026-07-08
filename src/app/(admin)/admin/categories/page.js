import { Suspense } from "react";

import { PageLoadingState } from "@/components/states/loading-states";
import { AdminCategoryPage } from "@/features/admin/categories/category-page";

export default function AdminCategoriesRoutePage() {
  return (
    <Suspense fallback={<PageLoadingState title="Loading categories" />}>
      <AdminCategoryPage />
    </Suspense>
  );
}
