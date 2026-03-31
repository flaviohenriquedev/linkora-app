import { Container } from "@/components/ui/Container";
import { MaterialsManager } from "@/components/admin/MaterialsManager";

export default function AdminMateriaisPage() {
  return (
    <main className="min-h-[calc(100vh-72px)]">
      <Container className="py-10">
        <h1 className="font-serif text-3xl text-text-primary">Materiais</h1>
        <p className="mt-2 max-w-2xl text-text-secondary">
          Materiais para download: título e arquivo. A visualização pública usa um modal com link para o anexo.
        </p>
        <div className="mt-6">
          <MaterialsManager />
        </div>
      </Container>
    </main>
  );
}
