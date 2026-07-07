import { TrackOrderPage } from "@/features/orders/track-order-page";

export default async function TrackOrderRoute({ searchParams }) {
  const params = await searchParams;
  return <TrackOrderPage initialOrderNumber={params?.orderNumber ?? ""} />;
}
