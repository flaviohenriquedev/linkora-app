import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ContentCard } from "@/components/content/ContentCard";
import { tryCreateClient } from "@/lib/supabase/server";

export async function BlogPreview() {
  const supabase = await tryCreateClient();
  const { data: rows } = supabase
    ? await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, image_file_id")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(3)
    : { data: null };

  const posts = rows ?? [];

  return (
    <Container className="pb-16 sm:pb-24">
      <h2 className="mb-8 text-center font-serif text-2xl sm:mb-12 sm:text-3xl md:text-4xl">
        Artigos recentes
      </h2>
      <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <ContentCard
            key={post.id}
            href={`/articles/${post.slug}`}
            title={post.title}
            description={post.excerpt}
            imageFileId={post.image_file_id}
          />
        ))}
      </div>
      {posts.length === 0 ? (
        <p className="text-center text-sm text-text-muted">Artigos em breve.</p>
      ) : null}
      <div className="mt-10 text-center">
        <Link href="/articles">
          <Button variant="outline" className="min-h-[48px] px-8">
            Ver todos os artigos
          </Button>
        </Link>
      </div>
    </Container>
  );
}
