import { Suspense } from "react";

import { PageLoadingState } from "@/components/states/loading-states";
import { AdminPaymentsPage } from "@/features/admin/payments/admin-payments-page";

export default function AdminPaymentsRoutePage() {
  return (
    <Suspense fallback={<PageLoadingState title="Loading manual payments" />}>
      <AdminPaymentsPage />
    </Suspense>
  );
}
