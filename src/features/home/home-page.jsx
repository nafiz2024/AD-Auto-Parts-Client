import { getHomepageData } from "@/features/home/home-api";
import { HomePageClient } from "@/features/home/home-page-client";

export async function HomePage() {
  const data = await getHomepageData();
  return <HomePageClient data={data} />;
}
