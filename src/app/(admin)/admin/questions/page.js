import { Suspense } from "react";
import { PageLoadingState } from "@/components/states/loading-states";
import { AdminQuestionsPage } from "@/features/admin/questions/admin-questions-page";

export default function AdminQuestionsRoutePage() {
  return (
    <Suspense fallback={<PageLoadingState title="Loading questions" />}>
      <AdminQuestionsPage />
    </Suspense>
  );
}
