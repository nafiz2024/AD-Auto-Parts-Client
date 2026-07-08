import { Suspense } from "react";

import { PageLoadingState } from "@/components/states/loading-states";
import { AdminOrdersPage } from "@/features/admin/orders/admin-orders-page";

export default function AdminOrdersRoutePage() {
  return (
    <Suspense fallback={<PageLoadingState title="Loading orders" />}>
      <AdminOrdersPage />
    </Suspense>
  );
}
