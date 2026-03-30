import { Container } from "@/components/ui/Container";

const STEPS = [
  {
    n: "01",
    title: "Encontre",
    body: "Busque pelo especialista ou fornecedor ideal para o seu momento de produção.",
  },
  {
    n: "02",
    title: "Conecte-se",
    body: "Envie uma mensagem direta ou agende uma reunião para alinhar os detalhes.",
  },
  {
    n: "03",
    title: "Produza",
    body: "Feche negócio com segurança e inicie ou escale a sua confecção.",
  },
];

export function HowItWorks() {
  return (
    <Container className="py-10 sm:py-14">
      <h2 className="mb-8 text-center font-serif text-2xl sm:mb-12 sm:text-3xl md:text-4xl">
        Como funciona
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="relative rounded-2xl border border-border bg-bg-secondary p-8"
          >
            <span className="pointer-events-none absolute right-6 top-4 font-serif text-6xl leading-none text-gold/30">
              {s.n}
            </span>
            <h3 className="relative z-[1] mb-3 text-xl">{s.title}</h3>
            <p className="relative z-[1] text-[15px] text-text-secondary">{s.body}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}
