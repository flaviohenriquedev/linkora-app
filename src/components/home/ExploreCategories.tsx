"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";

const CATS = [
  "Tudo",
  "Estilistas",
  "Modelistas",
  "Cortadores",
  "Tecidos",
  "Aviamentos",
  "Private Label",
  "Acabamento",
  "Marketing",
  "Fotógrafo",
  "Modelos",
  "Cursos",
  "Consultorias",
  "Mentorias",
];

export function ExploreCategories() {
  const [active, setActive] = useState("Tudo");
  return (
    <Container className="py-10 sm:py-14">
      <h2 className="mb-8 text-center font-serif text-2xl sm:mb-12 sm:text-3xl md:text-4xl">
        Explore por categoria
      </h2>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:-mx-6 sm:gap-3 sm:px-6 [&::-webkit-scrollbar]:hidden">
        {CATS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActive(c)}
            className={`min-h-[44px] whitespace-nowrap rounded-full border px-4 py-2.5 text-sm transition-all duration-300 sm:px-5 ${
              active === c
                ? "border-gold bg-[rgba(201,168,76,0.1)] text-gold"
                : "border-border bg-bg-card text-text-secondary hover:border-gold hover:text-gold"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </Container>
  );
}
