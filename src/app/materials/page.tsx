import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { MateriaisPublicClient } from "@/components/materiais/MateriaisPublicClient";

export const metadata: Metadata = {
  title: "Materiais — Linkora",
  description: "Materiais para download.",
};

export default function MaterialsPage() {
  return (
    <main className="min-h-[calc(100vh-72px)] animate-fade-in">
      <div className="border-b border-border bg-gradient-to-b from-bg-secondary/80 to-bg-primary py-12 sm:py-16">
        <Container>
          <p className="text-sm font-medium uppercase tracking-wider text-gold">Downloads</p>
          <h1 className="mt-2 font-serif text-3xl text-text-primary sm:text-4xl">Materiais</h1>
          <p className="mt-3 max-w-2xl text-text-secondary">
            Arquivos e documentos para apoiar sua operação. Toque em um card para visualizar e baixar.
          </p>
        </Container>
      </div>
      <MateriaisPublicClient />
      <Container className="pb-12">
        <div className="text-center">
          <Link href="/" className="text-sm text-gold hover:underline">
            ← Voltar ao início
          </Link>
        </div>
      </Container>
    </main>
  );
}
