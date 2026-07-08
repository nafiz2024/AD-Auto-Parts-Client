import { Suspense } from "react";

import { PageLoadingState } from "@/components/states/loading-states";
import { AdminCustomersPage } from "@/features/admin/customers/admin-customers-page";

export default function AdminCustomersRoutePage() {
  return (
    <Suspense fallback={<PageLoadingState title="Loading customers" />}>
      <AdminCustomersPage />
    </Suspense>
  );
}
