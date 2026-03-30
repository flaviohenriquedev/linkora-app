import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Blog & Tendências — LINKORA",
};

const POSTS = [
  {
    tag: "Tendências",
    title: "Cores Pantone Inverno 2024",
    date: "12 de Nov, 2023",
    excerpt:
      "Descubra a paleta que vai dominar as vitrines na próxima estação e como aplicá-la nas suas peças.",
    gradient: "bg-gradient-to-br from-bg-card to-green-main",
  },
  {
    tag: "Negócios",
    title: "Como precificar roupas?",
    date: "05 de Nov, 2023",
    excerpt: "Guia rápido do markup na confecção. Entenda de uma vez por todas como não perder dinheiro.",
    gradient: "bg-gradient-to-br from-border to-gold/40",
  },
  {
    tag: "Produção",
    title: "Tipos de Modelagem",
    date: "28 de Out, 2023",
    excerpt: "Plana ou moulage? Qual escolher para a sua marca e o tipo de caimento que você deseja.",
    gradient:
      "bg-gradient-to-br from-[#3A1C71] via-[#D76D77] to-[#FFAF7B]",
  },
  {
    tag: "Sustentabilidade",
    title: "Tecidos Eco-Friendly",
    date: "15 de Out, 2023",
    excerpt: "Conheça opções viáveis para tornar sua marca mais sustentável no Brasil.",
    gradient: "bg-gradient-to-br from-[#4b6cb7] to-[#182848]",
  },
  {
    tag: "Negócios",
    title: "Gestão de Facção",
    date: "02 de Out, 2023",
    excerpt: "Como alinhar prazos e evitar atrasos na entrega das suas coleções.",
    gradient: "bg-gradient-to-br from-bg-card to-[#C8956C]",
  },
  {
    tag: "Produção",
    title: "Ficha Técnica Perfeita",
    date: "20 de Set, 2023",
    excerpt:
      "O que não pode faltar na sua ficha técnica para evitar erros de produção em larga escala.",
    gradient: "bg-gradient-to-br from-[#536976] to-[#292E49]",
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-[calc(100vh-72px)] py-14">
      <Container>
        <h1 className="mb-8 font-serif text-3xl md:text-4xl">Blog & Tendências</h1>
        <div className="-mx-6 mb-10 flex gap-3 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["Todos", "Tendências", "Produção", "Negócios", "Sustentabilidade"].map((c) => (
            <span
              key={c}
              className="whitespace-nowrap rounded-full border border-border bg-bg-card px-5 py-2 text-sm text-text-secondary first:border-gold first:bg-[rgba(201,168,76,0.1)] first:text-gold"
            >
              {c}
            </span>
          ))}
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          {POSTS.map((post) => (
            <article
              key={post.title}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-bg-card transition hover:border-gold md:flex-row"
            >
              <div className={`h-48 shrink-0 md:h-auto md:w-[40%] ${post.gradient}`} />
              <div className="flex flex-1 flex-col p-8">
                <span className="mb-2 inline-block w-fit rounded bg-[rgba(46,125,82,0.2)] px-2 py-0.5 text-xs text-green-light">
                  {post.tag}
                </span>
                <h2 className="mb-3 font-serif text-xl md:text-[22px]">{post.title}</h2>
                <p className="mb-2 text-[13px] text-text-secondary">{post.date}</p>
                <p className="mb-6 flex-1 text-text-secondary">{post.excerpt}</p>
                <Button variant="outline" className="w-full">
                  Ler mais →
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </main>
  );
}
