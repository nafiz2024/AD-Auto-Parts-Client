import { Suspense } from "react";

import { PageLoadingState } from "@/components/states/loading-states";
import { AdminSettingsPage } from "@/features/admin/settings/admin-settings-page";

export default function AdminSettingsRoutePage() {
  return (
    <Suspense fallback={<PageLoadingState title="Loading settings" />}>
      <AdminSettingsPage />
    </Suspense>
  );
}
