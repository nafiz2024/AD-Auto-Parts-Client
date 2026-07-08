import { AdminInvoiceDetailPage } from "@/features/admin/invoices/admin-invoice-detail-page";

export default async function AdminInvoiceDetailRoutePage({ params }) {
  const { invoiceNumber } = await params;

  return <AdminInvoiceDetailPage invoiceNumber={invoiceNumber} />;
}
