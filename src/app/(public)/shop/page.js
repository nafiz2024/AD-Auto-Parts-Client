import { ListingPage } from "@/features/listing/listing-page";
import { getListingPageData } from "@/features/listing/listing-api";
import { routes } from "@/constants/routes";

export const metadata = {
  title: "Shop Auto Parts | AD Auto Parts",
  description:
    "Browse inspected used auto parts across categories and brands for customers in Saudi Arabia.",
};

export default async function ShopPage({ searchParams }) {
  const data = await getListingPageData({
    mode: "shop",
    searchParams,
  });

  return <ListingPage data={data} basePath={routes.public.shop} />;
}
