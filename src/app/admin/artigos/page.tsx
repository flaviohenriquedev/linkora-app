import { Container } from "@/components/ui/Container";
import { ArticlesManager } from "@/components/admin/ArticlesManager";

export default function AdminArtigosPage() {
  return (
    <main className="min-h-[calc(100vh-72px)]">
      <Container className="py-10">
        <h1 className="font-serif text-3xl text-text-primary">Artigos</h1>
        <p className="mt-2 max-w-2xl text-text-secondary">
          Cadastre artigos com descrição, imagem de capa e anexos. Conteúdo completo aparece na página pública do
          artigo.
        </p>
        <div className="mt-6">
          <ArticlesManager />
        </div>
      </Container>
    </main>
  );
}
