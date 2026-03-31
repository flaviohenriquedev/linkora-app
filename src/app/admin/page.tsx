import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export default function AdminPage() {
  return (
    <main className="min-h-[calc(100vh-72px)]">
      <Container className="py-10">
        <h1 className="font-serif text-3xl text-text-primary">Painel Administrativo</h1>
        <p className="mt-3 max-w-2xl text-text-secondary">
          Gestão de conteúdo: artigos, cursos, materiais e categorias.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/categories">
            <Button variant="gold" className="w-full justify-center">
              Categorias
            </Button>
          </Link>
          <Link href="/admin/artigos">
            <Button variant="outline" className="w-full justify-center">
              Artigos
            </Button>
          </Link>
          <Link href="/admin/courses">
            <Button variant="outline" className="w-full justify-center">
              Cursos
            </Button>
          </Link>
          <Link href="/admin/materiais">
            <Button variant="outline" className="w-full justify-center">
              Materiais
            </Button>
          </Link>
        </div>
      </Container>
    </main>
  );
}
