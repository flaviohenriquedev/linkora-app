"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";

export type ExploreCategoryItem = { id: string; name: string; slug: string };

type Props = {
  categories: ExploreCategoryItem[];
};

export function ExploreCategoriesClient({ categories }: Props) {
  const [active, setActive] = useState<"all" | string>("all");

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
    </Container>
  );
}
