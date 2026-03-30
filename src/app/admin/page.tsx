import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export default function AdminPage() {
  return (
    <main className="min-h-[calc(100vh-72px)]">
      <Container className="py-10">
        <h1 className="font-serif text-3xl text-text-primary">Painel Administrativo</h1>
        <p className="mt-3 max-w-2xl text-text-secondary">
          Área exclusiva para gestão global do sistema: blog, cursos, categorias e configurações.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/categories">
            <Button variant="gold" className="w-full justify-center">
              Gerenciar Categorias
            </Button>
          </Link>
          <Link href="/admin/blog">
            <Button variant="outline" className="w-full justify-center">
              Blog
            </Button>
          </Link>
          <Link href="/admin/courses">
            <Button variant="outline" className="w-full justify-center">
              Cursos
            </Button>
          </Link>
        </div>
      </Container>
    </main>
  );
}
