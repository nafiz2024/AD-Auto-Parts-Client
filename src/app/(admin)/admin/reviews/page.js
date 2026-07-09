import { Suspense } from "react";
import { PageLoadingState } from "@/components/states/loading-states";
import { AdminReviewsPage } from "@/features/admin/reviews/admin-reviews-page";

export default function AdminReviewsRoutePage() {
  return (
    <Suspense fallback={<PageLoadingState title="Loading reviews" />}>
      <AdminReviewsPage />
    </Suspense>
  );
}
