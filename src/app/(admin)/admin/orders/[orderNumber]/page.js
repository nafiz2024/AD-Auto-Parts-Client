import { AdminOrderDetailPage } from "@/features/admin/orders/admin-order-detail-page";

export default async function AdminOrderDetailRoutePage({ params }) {
  const { orderNumber } = await params;

  return <AdminOrderDetailPage orderNumber={orderNumber} />;
}
