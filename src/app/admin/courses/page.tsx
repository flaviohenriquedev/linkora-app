import { Container } from "@/components/ui/Container";
import { CoursesManager } from "@/components/admin/CoursesManager";

export default function AdminCoursesPage() {
  return (
    <main className="min-h-[calc(100vh-72px)]">
      <Container className="py-10">
        <h1 className="font-serif text-3xl text-text-primary">Cursos</h1>
        <p className="mt-2 max-w-2xl text-text-secondary">
          Cadastre cursos exibidos no site. Use a ordem para controlar a listagem.
        </p>
        <div className="mt-6">
          <CoursesManager />
        </div>
      </Container>
    </main>
  );
}
