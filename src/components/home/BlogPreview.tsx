import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

const POSTS = [
  {
    tag: "Tendências",
    title: "Cores Pantone Inverno 2024",
    excerpt: "Descubra a paleta que vai dominar as vitrines...",
    gradient: "from-bg-secondary to-border",
  },
  {
    tag: "Negócios",
    title: "Como precificar roupas?",
    excerpt: "Guia rápido do markup na confecção...",
    gradient: "from-border to-bg-secondary",
  },
  {
    tag: "Produção",
    title: "Tipos de Modelagem",
    excerpt: "Plana ou moulage? Qual escolher para a sua marca...",
    gradient: "from-bg-card to-green-main",
  },
];

export function BlogPreview() {
  return (
    <Container className="pb-16 sm:pb-24">
      <h2 className="mb-8 text-center font-serif text-2xl sm:mb-12 sm:text-3xl md:text-4xl">
        Últimas do Blog
      </h2>
      <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-3">
        {POSTS.map((post) => (
          <article
            key={post.title}
            className="flex flex-col rounded-2xl border border-border bg-bg-card p-6 transition hover:border-gold"
          >
            <div
              className={`mb-4 h-[140px] rounded-lg bg-gradient-to-br ${post.gradient}`}
            />
            <span className="mb-2 inline-block rounded bg-[rgba(46,125,82,0.2)] px-2 py-0.5 text-xs text-green-light">
              {post.tag}
            </span>
            <h3 className="mb-2 font-sans text-lg">{post.title}</h3>
            <p className="mb-4 flex-1 text-sm text-text-muted">{post.excerpt}</p>
            <Link href="/blog">
              <Button variant="outline" className="w-full">
                Ler mais →
              </Button>
            </Link>
          </article>
        ))}
      </div>
    </Container>
  );
}
