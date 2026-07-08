import { CustomerInvoiceDetailPage } from "@/features/invoices/invoice-detail-page";

export default async function AccountInvoiceDetailRoute({ params }) {
  const { invoiceNumber } = await params;

  return <CustomerInvoiceDetailPage invoiceNumber={invoiceNumber} />;
}
