import { ListingPage } from "@/features/listing/listing-page";
import { getListingPageData } from "@/features/listing/listing-api";
import { routes } from "@/constants/routes";

export default async function ProductsPage({ searchParams }) {
  const data = await getListingPageData({
    mode: "shop",
    searchParams,
  });

  return <ListingPage data={data} basePath={routes.public.products} />;
}
