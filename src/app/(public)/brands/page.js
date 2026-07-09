import { ListingPage } from "@/features/listing/listing-page";
import { getListingPageData } from "@/features/listing/listing-api";
import { routes } from "@/constants/routes";

export const metadata = {
  title: "Brands | AD Auto Parts",
  description:
    "Browse used auto parts by brand with backend-driven filtering and Saudi storefront support.",
};

export default async function BrandsPage({ searchParams }) {
  const data = await getListingPageData({
    mode: "shop",
    searchParams,
  });

  return <ListingPage data={data} basePath={routes.public.brands} />;
}
