import { OrderSuccessPage } from "@/features/checkout/order-success-page";

export default async function CheckoutSuccessRoute({ searchParams }) {
  const params = await searchParams;
  return <OrderSuccessPage searchParams={params ?? {}} />;
}
