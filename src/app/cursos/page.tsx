import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ContentCard } from "@/components/content/ContentCard";
import { tryCreateClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Cursos — LINKORA",
  description: "Cursos e formação na plataforma Linkora.",
};

export const dynamic = "force-dynamic";

export default async function CursosPage() {
  const supabase = await tryCreateClient();
  const { data: rows } = supabase
    ? await supabase
        .from("courses")
        .select("id, title, slug, description, image_file_id, sort_order")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("title", { ascending: true })
    : { data: null };

  const courses = rows ?? [];

  return (
    <main className="min-h-[calc(100vh-72px)] animate-fade-in">
      <div className="border-b border-border bg-gradient-to-b from-green-main/15 to-bg-primary py-12 sm:py-16">
        <Container>
          <p className="text-sm font-medium uppercase tracking-wider text-green-light">Aprendizado</p>
          <h1 className="mt-2 font-serif text-3xl text-text-primary sm:text-4xl">Cursos</h1>
          <p className="mt-3 max-w-2xl text-text-secondary">
            Trilhas e materiais para evoluir sua operação e sua marca na moda.
          </p>
        </Container>
      </div>
      <Container className="py-10 sm:py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <ContentCard
              key={c.id}
              href={`/cursos/${c.slug}`}
              title={c.title}
              description={c.description}
              imageFileId={c.image_file_id}
            />
          ))}
        </div>
        {courses.length === 0 ? (
          <p className="text-center text-text-muted">Nenhum curso publicado ainda.</p>
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
