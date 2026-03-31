"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Container } from "@/components/ui/Container";
import { ProfessionalCard } from "@/components/professionals/ProfessionalCard";
import type { PublicCategory, PublicProfessional } from "@/lib/public-professionals-shared";

type Props = {
  categories: PublicCategory[];
  professionals: PublicProfessional[];
};

export function ExploreCategoriesClient({ categories, professionals }: Props) {
  const [active, setActive] = useState<"all" | string>("all");
  const filtered = useMemo(
    () => professionals.filter((p) => active === "all" || p.categorySlugs.includes(active)),
    [active, professionals],
  );

  const pill =
    "shrink-0 flex-none min-h-[44px] whitespace-nowrap rounded-full border px-4 py-2.5 text-sm transition-all duration-300 sm:px-5";

  return (
    <Container className="min-w-0 py-10 sm:py-14">
      <h2 className="mb-8 text-center font-serif text-2xl sm:mb-12 sm:text-3xl md:text-4xl">
        Explore por categoria
      </h2>
      {/* min-w-0 + shrink-0 nos itens: sem isso o flex comprime os pills em vez de rolar */}
      <div className="w-full min-w-0">
        <div
          className="-mx-4 flex max-w-full flex-nowrap gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain px-4 pb-3 pt-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.25)_transparent] sm:-mx-6 sm:gap-3 sm:px-6 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent"
          tabIndex={0}
          role="region"
          aria-label="Categorias — role para o lado para ver todas"
        >
          <button
            type="button"
            onClick={() => setActive("all")}
            className={`${pill} ${
              active === "all"
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
              onClick={() => setActive(c.slug)}
              className={`${pill} ${
                active === c.slug
                  ? "border-gold bg-[rgba(201,168,76,0.1)] text-gold"
                  : "border-border bg-bg-card text-text-secondary hover:border-gold hover:text-gold"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 grid gap-5 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7 xl:grid-cols-4">
        {filtered.map((p) => (
          <ProfessionalCard key={p.id} professional={p} />
        ))}
      </div>
      {!filtered.length ? (
        <p className="mt-7 text-center text-sm text-text-muted">
          Nenhum prestador encontrado nessa categoria no momento.
        </p>
      ) : null}
      <div className="mt-7 text-center sm:mt-8">
        <Link
          href="/professionals"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm text-text-secondary transition hover:border-gold hover:text-gold"
        >
          Ver todos os profissionais
        </Link>
      </div>
    </Container>
  );
}
