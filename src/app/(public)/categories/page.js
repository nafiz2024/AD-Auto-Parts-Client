import { ListingPage } from "@/features/listing/listing-page";
import { getListingPageData } from "@/features/listing/listing-api";
import { routes } from "@/constants/routes";

export const metadata = {
  title: "Categories | AD Auto Parts",
  description:
    "Explore product categories for inspected used auto parts available through AD Auto Parts.",
};

export default async function CategoriesPage({ searchParams }) {
  const data = await getListingPageData({
    mode: "shop",
    searchParams,
  });

  return <ListingPage data={data} basePath={routes.public.categories} />;
}
