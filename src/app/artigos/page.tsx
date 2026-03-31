import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ContentCard } from "@/components/content/ContentCard";
import { tryCreateClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Artigos — LINKORA",
  description: "Artigos e conteúdos da moda.",
};

export const dynamic = "force-dynamic";

export default async function ArtigosPage() {
  const supabase = await tryCreateClient();
  const { data: rows } = supabase
    ? await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, image_file_id, published_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false, nullsFirst: false })
    : { data: null };

  const articles = rows ?? [];

  return (
    <main className="min-h-[calc(100vh-72px)] animate-fade-in">
      <div className="border-b border-border bg-gradient-to-b from-bg-secondary/80 to-bg-primary py-12 sm:py-16">
        <Container>
          <p className="text-sm font-medium uppercase tracking-wider text-gold">Conteúdo</p>
          <h1 className="mt-2 font-serif text-3xl text-text-primary sm:text-4xl">Artigos</h1>
          <p className="mt-3 max-w-2xl text-text-secondary">
            Leituras sobre moda, negócios e produção — atualizado pelo time Linkora.
          </p>
        </Container>
      </div>
      <Container className="py-10 sm:py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ContentCard
              key={a.id}
              href={`/artigos/${a.slug}`}
              title={a.title}
              description={a.excerpt}
              imageFileId={a.image_file_id}
            />
          ))}
        </div>
        {articles.length === 0 ? (
          <p className="text-center text-text-muted">Nenhum artigo publicado ainda.</p>
        ) : null}
        <div className="mt-10 text-center">
          <Link href="/" className="text-sm text-gold hover:underline">
            ← Voltar ao início
          </Link>
        </div>
      </Container>
    </main>
  );
}
