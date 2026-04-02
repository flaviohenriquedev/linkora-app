"use client";

import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { formatCentsToBrl } from "@/lib/currency";
import type { PublicProfessionalDetail } from "@/lib/public-professionals-shared";

const TABS = [
  { id: "about", label: "Sobre" },
  { id: "services", label: "Serviços" },
  { id: "portfolio", label: "Portfólio" },
  { id: "reviews", label: "Avaliações" },
] as const;

type Props = {
  professional: PublicProfessionalDetail;
};

function stars(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

export function PublicProfessionalProfile({ professional: p }: Props) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("about");

  return (
    <Container className="py-10">
      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-bg-card">
        <div className="h-[120px] bg-gradient-to-r from-bg-secondary to-green-main" />
        <div className="relative flex flex-wrap items-end gap-6 px-8 pb-8">
          <div
            className="-mt-12 flex h-[100px] w-[100px] shrink-0 overflow-hidden rounded-full border-4 border-bg-card font-serif text-4xl font-semibold text-white"
            style={p.avatarUrl ? undefined : { backgroundColor: p.color }}
          >
            {p.avatarUrl ? (
              <img src={p.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center">{p.initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="mb-1 font-serif text-2xl md:text-[28px]">{p.name}</h1>
                <span className="mb-2 inline-block rounded bg-[rgba(46,125,82,0.2)] px-2 py-0.5 text-xs text-green-light">
                  {p.specialty}
                </span>
                <p className="mt-1 text-text-muted">{p.city}</p>
                {p.priceLabel ? (
                  <p className="mt-2 text-sm font-medium text-gold">{p.priceLabel}</p>
                ) : null}
                <div className="mt-2 flex items-center gap-2 text-sm text-text-secondary">
                  <span className="text-gold">{stars(p.stars)}</span>
                  <span>({p.reviews} avaliações)</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/schedule">
                  <Button variant="green">Agendar</Button>
                </Link>
                <Link href="/chat">
                  <Button variant="outline">Chat</Button>
                </Link>
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
          <h2 className="mb-4 text-xl">Sobre</h2>
          {p.bio?.trim() ? <p className="max-w-3xl whitespace-pre-line text-text-secondary">{p.bio}</p> : null}
        </div>
      )}

      {tab === "services" && (
        <div className="flex flex-col gap-4">
          {p.services.length === 0 ? (
            <p className="text-text-muted">Nenhum serviço cadastrado ainda.</p>
          ) : (
            p.services.map((s) => (
              <div
                key={s.id}
                className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-bg-card p-6 sm:flex-row sm:items-start"
              >
                <div className="min-w-0">
                  <h3 className="mb-1 text-lg text-text-primary">{s.title}</h3>
                  {s.category ? (
                    <span className="mb-2 inline-block text-xs text-green-light">{s.category.name}</span>
                  ) : null}
                  {s.description ? (
                    <p className="mt-1 text-sm text-text-secondary">{s.description}</p>
                  ) : null}
                </div>
                <span className="shrink-0 font-medium text-gold sm:pt-0.5 sm:text-right">
                  {s.price_cents != null && Number.isFinite(s.price_cents)
                    ? `R$ ${formatCentsToBrl(s.price_cents)}`
                    : "Sob consulta"}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "portfolio" && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-bg-card text-text-muted"
            >
              Portfólio {i}
            </div>
          ))}
        </div>
      )}

      {tab === "reviews" && <p className="text-text-muted">Avaliações em breve.</p>}
    </Container>
  );
}
