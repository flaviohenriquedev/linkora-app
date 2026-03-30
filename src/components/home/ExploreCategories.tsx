import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ExploreCategoriesClient } from "@/components/home/ExploreCategoriesClient";

/** Carrega categorias ativas de `public.categories` no servidor (render direto da tabela). */
export async function ExploreCategories() {
  noStore();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    return (
      <ExploreCategoriesClient
        categories={[]}
      />
    );
  }

  return <ExploreCategoriesClient categories={data ?? []} />;
}
