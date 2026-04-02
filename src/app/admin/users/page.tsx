import Link from "next/link";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { Container } from "@/components/ui/Container";

export const metadata = {
  title: "Usuários — Admin — Linkora",
};

export default function AdminUsersPage() {
  return (
    <main className="min-h-[calc(100vh-72px)]">
      <Container className="py-10">
        <p className="mb-4">
          <Link href="/admin" className="text-sm text-gold hover:underline">
            ← Painel administrativo
          </Link>
        </p>
        <h1 className="font-serif text-3xl text-text-primary">Usuários cadastrados</h1>
        <p className="mt-2 max-w-2xl text-text-secondary">
          Lista completa para gestão de contas. Prestadores inativos não aparecem nas buscas públicas.
        </p>
        <div className="mt-8">
          <AdminUsersTable />
        </div>
      </Container>
    </main>
  );
}
