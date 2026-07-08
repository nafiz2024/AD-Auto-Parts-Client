import { Suspense } from "react";

import { PageLoadingState } from "@/components/states/loading-states";
import { AdminShipmentsPage } from "@/features/admin/shipments/admin-shipments-page";

export default function AdminShipmentsRoutePage() {
  return (
    <Suspense fallback={<PageLoadingState title="Loading shipments" />}>
      <AdminShipmentsPage />
    </Suspense>
  );
}
