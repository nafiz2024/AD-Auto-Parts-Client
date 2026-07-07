import { ListingPage } from "@/features/listing/listing-page";
import { getListingPageData } from "@/features/listing/listing-api";
import { routes } from "@/constants/routes";

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const data = await getListingPageData({
    mode: "category",
    categorySlug: slug,
    searchParams,
  });

  return <ListingPage data={data} basePath={routes.public.categoryDetail(slug)} />;
}
