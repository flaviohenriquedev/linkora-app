"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/ui/Container";
import { ProfessionalCard } from "@/components/professionals/ProfessionalCard";
import type { PublicCategory, PublicProfessional } from "@/lib/public-professionals";

type Props = {
  categories: PublicCategory[];
  professionals: PublicProfessional[];
};

export function ProfessionalsExplorer({ categories, professionals }: Props) {
  const [filter, setFilter] = useState<"all" | string>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return professionals.filter((p) => {
      const okFilter = filter === "all" || p.categorySlugs.includes(filter);
      if (!q) return okFilter;
      const hay = `${p.name} ${p.city} ${p.specialty}`.toLowerCase();
      return okFilter && hay.includes(q);
    });
  }, [filter, query, professionals]);

  return (
    <Container className="py-14">
      <h2 className="mb-6 font-serif text-3xl md:text-4xl">
        Encontre os melhores da moda
      </h2>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex max-w-[400px] flex-1 items-center gap-1.5 rounded-lg border border-border bg-bg-card p-1.5 focus-within:border-gold">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busque por nome, cidade ou especialidade"
            className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-text-primary outline-none placeholder:text-text-muted"
          />
        </div>
        <div className="-mx-1 flex max-w-full flex-nowrap gap-2 overflow-x-auto overflow-y-hidden px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.25)_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`whitespace-nowrap rounded-full border px-5 py-2 text-sm transition-all duration-300 ${
              filter === "all"
                ? "border-gold bg-[rgba(201,168,76,0.1)] text-gold"
                : "border-border bg-bg-card text-text-secondary hover:border-gold hover:text-gold"
            }`}
          >
            Tudo
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.slug)}
              className={`whitespace-nowrap rounded-full border px-5 py-2 text-sm transition-all duration-300 ${
                filter === c.slug
                  ? "border-gold bg-[rgba(201,168,76,0.1)] text-gold"
                  : "border-border bg-bg-card text-text-secondary hover:border-gold hover:text-gold"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-7">
        {filtered.map((p) => (
          <ProfessionalCard key={p.id} professional={p} />
        ))}
      </div>
      {!filtered.length ? (
        <p className="mt-8 text-sm text-text-muted">Nenhum prestador encontrado para os filtros selecionados.</p>
      ) : null}
    </Container>
  );
}
