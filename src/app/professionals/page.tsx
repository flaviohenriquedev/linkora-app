import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { ProfessionalsExplorer } from "@/components/professionals/ProfessionalsExplorer";
import { getPublicProfessionalsAndCategories } from "@/lib/public-professionals";

export const metadata: Metadata = {
  title: "Profissionais — LINKORA",
  description: "Encontre estilistas, modelistas e fornecedores da moda.",
};

export default async function ProfessionalsPage() {
  noStore();
  const { categories, professionals } = await getPublicProfessionalsAndCategories();

  return (
    <main className="min-h-[calc(100vh-72px)]">
      <ProfessionalsExplorer categories={categories} professionals={professionals} />
    </main>
  );
}
