import { Container } from "@/components/ui/Container";
import { ProfessionalCard } from "@/components/professionals/ProfessionalCard";
import { getPublicProfessionalsAndCategories } from "@/lib/public-professionals";

export async function HomeProfessionalsGrid() {
  const { professionals } = await getPublicProfessionalsAndCategories();
  const slice = professionals.slice(0, 4);
  return (
    <Container className="pb-12 sm:pb-16">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7 xl:grid-cols-4">
        {slice.map((p) => (
          <ProfessionalCard key={p.id} professional={p} />
        ))}
      </div>
    </Container>
  );
}
