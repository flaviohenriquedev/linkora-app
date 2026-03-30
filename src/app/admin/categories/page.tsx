import { Container } from "@/components/ui/Container";
import { CategoriesManager } from "@/components/admin/CategoriesManager";

export default function AdminCategoriesPage() {
  return (
    <main className="min-h-[calc(100vh-72px)]">
      <Container className="py-10">
        <h1 className="font-serif text-3xl text-text-primary">Categorias</h1>
        <p className="mt-2 max-w-2xl text-text-secondary">
          Gerencie categorias globais usadas em blog, cursos e navegação do sistema.
        </p>
        <div className="mt-6">
          <CategoriesManager />
        </div>
      </Container>
    </main>
  );
}
