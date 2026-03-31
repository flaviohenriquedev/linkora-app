import { unstable_noStore as noStore } from "next/cache";
import { ExploreCategoriesClient } from "@/components/home/ExploreCategoriesClient";
import { getPublicProfessionalsAndCategories } from "@/lib/public-professionals";

/** Carrega categorias e prestadores ativos no servidor. */
export async function ExploreCategories() {
  noStore();
  const { categories, professionals } = await getPublicProfessionalsAndCategories();
  return <ExploreCategoriesClient categories={categories} professionals={professionals} />;
}
