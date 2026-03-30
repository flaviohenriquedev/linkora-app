"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

const TABS = [
  { id: "about", label: "Sobre" },
  { id: "services", label: "Serviços" },
  { id: "portfolio", label: "Portfólio" },
  { id: "reviews", label: "Avaliações" },
] as const;

export function ProfessionalProfile() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("about");

  return (
    <Container className="py-10">
      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-bg-card">
        <div className="h-[120px] bg-gradient-to-r from-bg-secondary to-green-main" />
        <div className="relative flex flex-wrap items-end gap-6 px-8 pb-8">
          <div className="-mt-12 flex h-[100px] w-[100px] shrink-0 items-center justify-center rounded-full border-4 border-bg-card bg-green-main font-serif text-4xl font-semibold text-white">
            AB
          </div>
          <div className="min-w-0 flex-1 pt-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="mb-1 font-serif text-2xl md:text-[28px]">Ana Beatriz Costa</h1>
                <span className="mb-2 inline-block rounded bg-[rgba(46,125,82,0.2)] px-2 py-0.5 text-xs text-green-light">
                  Estilista
                </span>
                <p className="mt-1 text-text-muted">São Paulo, SP</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-text-secondary">
                  <span className="text-gold">★★★★★</span>
                  <span>(47 avaliações)</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/schedule">
                  <Button variant="green">Agendar</Button>
                </Link>
                <Link href="/chat">
                  <Button variant="outline">Chat</Button>
                </Link>
                <Button variant="outline">Portfólio</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-6 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`border-b-2 pb-3 text-[15px] transition ${
              tab === t.id
                ? "border-gold font-medium text-gold"
                : "border-transparent text-text-secondary hover:text-gold"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "about" && (
        <div>
          <h2 className="mb-4 text-xl">Sobre mim</h2>
          <p className="max-w-3xl text-text-secondary">
            Especialista em moda feminina com 10 anos de experiência. Foco em sustentabilidade e
            tecidos naturais. Criação de coleções do zero, pesquisa de tendências e acompanhamento de
            prova de roupas.
          </p>
        </div>
      )}

      {tab === "services" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-bg-card p-6 sm:flex-row sm:items-center">
            <div>
              <h3 className="mb-1 text-lg">Criação de Coleção Completa</h3>
              <p className="text-sm text-text-secondary">
                Pesquisa, painel semântico, croquis e fichas técnicas.
              </p>
            </div>
            <span className="font-medium text-gold">R$ 2.500 a R$ 5.000</span>
          </div>
          <div className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-bg-card p-6 sm:flex-row sm:items-center">
            <div>
              <h3 className="mb-1 text-lg">Ficha Técnica Avulsa</h3>
              <p className="text-sm text-text-secondary">Detalhamento para produção e modelagem.</p>
            </div>
            <span className="font-medium text-gold">R$ 150 / peça</span>
          </div>
        </div>
      )}

      {tab === "portfolio" && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-bg-card text-text-muted"
            >
              Img {i}
            </div>
          ))}
        </div>
      )}

      {tab === "reviews" && (
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-bg-card p-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-border" />
                <div>
                  <strong>{i === 1 ? "Mariana Silva" : "Boutique X"}</strong>
                  <div className="text-xs text-gold">★★★★★</div>
                </div>
              </div>
              <p className="text-text-secondary">
                {i === 1
                  ? "Excelente profissional! As fichas técnicas vieram impecáveis, facilitou muito a vida na facção."
                  : "Entregou a coleção no prazo e com um bom gosto incrível."}
              </p>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
