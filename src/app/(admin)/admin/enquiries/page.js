import { Suspense } from "react";

import { PageLoadingState } from "@/components/states/loading-states";
import { AdminEnquiriesPage } from "@/features/admin/enquiries/admin-enquiries-page";

export default function AdminEnquiriesRoutePage() {
  return (
    <Suspense fallback={<PageLoadingState title="Loading enquiries" />}>
      <AdminEnquiriesPage />
    </Suspense>
  );
}
