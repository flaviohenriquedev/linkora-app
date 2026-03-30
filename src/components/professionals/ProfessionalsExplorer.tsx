"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/ui/Container";
import { ProfessionalCard } from "@/components/professionals/ProfessionalCard";
import type { Professional } from "@/lib/professionals";
import { professionals } from "@/lib/professionals";

const FILTERS: { value: string; label: string }[] = [
  { value: "Tudo", label: "Tudo" },
  { value: "Estilista", label: "Estilistas" },
  { value: "Modelista", label: "Modelistas" },
  { value: "Cortadora", label: "Cortadores" },
  { value: "Tecidos", label: "Tecidos" },
];

function matchesFilter(p: Professional, filter: string) {
  if (filter === "Tudo") return true;
  if (filter === "Tecidos") return p.role === "Tecidos" || p.specialty.includes("Tecido");
  return p.role === filter || p.specialty.includes(filter);
}

export function ProfessionalsExplorer() {
  const [filter, setFilter] = useState("Tudo");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return professionals.filter((p) => {
      const okFilter = matchesFilter(p, filter);
      if (!q) return okFilter;
      const hay = `${p.name} ${p.city} ${p.specialty}`.toLowerCase();
      return okFilter && hay.includes(q);
    });
  }, [filter, query]);

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
            placeholder="Busque por nome, cidade ou especialidade..."
            className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-text-primary outline-none placeholder:text-text-muted"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`whitespace-nowrap rounded-full border px-5 py-2 text-sm transition-all duration-300 ${
                filter === f.value
                  ? "border-gold bg-[rgba(201,168,76,0.1)] text-gold"
                  : "border-border bg-bg-card text-text-secondary hover:border-gold hover:text-gold"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-7">
        {filtered.map((p) => (
          <ProfessionalCard key={p.id} professional={p} />
        ))}
      </div>
    </Container>
  );
}
