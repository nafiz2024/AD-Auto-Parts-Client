import { Suspense } from "react";

import { PageLoadingState } from "@/components/states/loading-states";
import { AdminNotificationsPage } from "@/features/admin/notifications/admin-notifications-page";

export default function AdminNotificationsRoutePage() {
  return (
    <Suspense fallback={<PageLoadingState title="Loading notifications" />}>
      <AdminNotificationsPage />
    </Suspense>
  );
}
