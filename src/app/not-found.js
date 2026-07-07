import { PublicLayout } from "@/components/layout/public-layout";
import { NotFoundState } from "@/components/states/not-found-state";

export default function NotFound() {
  return (
    <PublicLayout>
      <NotFoundState />
    </PublicLayout>
  );
}
