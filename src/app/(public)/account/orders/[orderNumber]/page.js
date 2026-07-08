import { AccountOrderDetailPage } from "@/features/account/order-detail-page";

export default async function AccountOrderDetailRoute({ params }) {
  const resolvedParams = await params;
  return <AccountOrderDetailPage orderNumber={resolvedParams?.orderNumber ?? ""} />;
}
