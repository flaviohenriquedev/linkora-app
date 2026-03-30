"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <main className="min-h-[calc(100vh-72px)] py-16">
      <Container>
        <h1 className="font-serif text-2xl text-text-primary">Erro no servidor</h1>
        <p className="mt-3 max-w-xl text-text-secondary">
          Algo impediu esta página de carregar. Em produção, confira no Vercel (Logs da função) a mensagem
          exata. As causas mais comuns são variáveis do Supabase ausentes no deploy ou tabelas/migrations
          ainda não aplicadas no banco.
        </p>
        <p className="mt-4 rounded-lg border border-border bg-bg-card p-3 font-mono text-sm text-red-300">
          {error.message}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="gold" onClick={() => reset()}>
            Tentar de novo
          </Button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-transparent px-6 py-2.5 text-[15px] font-medium text-text-primary transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:text-gold"
          >
            Ir ao início
          </Link>
        </div>
      </Container>
    </main>
  );
}
