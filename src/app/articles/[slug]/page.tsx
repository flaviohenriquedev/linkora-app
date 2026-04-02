import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticlePublicAttachment } from "@/components/content/ArticlePublicAttachment";
import { ArtigoHeroPublic } from "@/components/content/ArtigoHeroPublic";
import { Container } from "@/components/ui/Container";
import { tryCreateClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await tryCreateClient();
  if (!supabase) return { title: "Artigo — Linkora" };
  const { data } = await supabase
    .from("blog_posts")
    .select("title, excerpt")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!data) return { title: "Artigo — Linkora" };
  return {
    title: `${data.title} — Linkora`,
    description: data.excerpt ?? undefined,
  };
}

export default async function ArticleSlugPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await tryCreateClient();
  if (!supabase) notFound();

  const { data: article } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, body, image_file_id, attachment_file_id, published_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!article) notFound();

  const publishedLabel =
    article.published_at != null
      ? new Date(article.published_at).toLocaleDateString("pt-BR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Artigo";

  return (
    <main className="min-h-[calc(100vh-72px)]">
      {article.image_file_id ? (
        <ArtigoHeroPublic
          imageFileId={article.image_file_id}
          title={article.title}
          excerpt={article.excerpt}
          publishedLabel={publishedLabel}
        />
      ) : (
        <div className="border-b border-border bg-gradient-to-br from-bg-secondary to-bg-primary py-12 sm:py-16">
          <Container>
            <p className="text-xs font-medium uppercase tracking-wider text-gold">{publishedLabel}</p>
            <h1 className="mt-2 max-w-4xl font-serif text-3xl text-text-primary sm:text-4xl">{article.title}</h1>
            {article.excerpt ? <p className="mt-4 max-w-2xl text-text-secondary">{article.excerpt}</p> : null}
          </Container>
        </div>
      )}

      <Container className="py-10 sm:py-14">
        <article className="mx-auto max-w-3xl">
          <div className="prose prose-invert max-w-none prose-p:text-text-secondary prose-headings:font-serif prose-headings:text-text-primary prose-a:text-gold">
            {article.body ? (
              <div className="whitespace-pre-wrap text-[17px] leading-relaxed text-text-secondary">{article.body}</div>
            ) : (
              <p className="text-text-muted">Sem conteúdo adicional.</p>
            )}
          </div>
          {article.attachment_file_id ? <ArticlePublicAttachment fileId={article.attachment_file_id} /> : null}
        </article>
        <div className="mx-auto mt-12 max-w-3xl border-t border-border pt-8">
          <Link href="/articles" className="text-sm text-gold hover:underline">
            ← Todos os artigos
          </Link>
        </div>
      </Container>
    </main>
  );
}
