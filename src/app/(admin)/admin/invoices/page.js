import { Suspense } from "react";
import { PageLoadingState } from "@/components/states/loading-states";
import { AdminInvoicesPage } from "@/features/admin/invoices/admin-invoices-page";

export default function AdminInvoicesRoutePage() {
  return (
    <Suspense fallback={<PageLoadingState title="Loading invoices" />}>
      <AdminInvoicesPage />
    </Suspense>
  );
}
