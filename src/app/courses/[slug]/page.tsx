import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { getSignedUrlForPublicFile } from "@/lib/public-files";
import { tryCreateClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await tryCreateClient();
  if (!supabase) return { title: "Curso — LINKORA" };
  const { data } = await supabase
    .from("courses")
    .select("title, description")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!data) return { title: "Curso — LINKORA" };
  return {
    title: `${data.title} — LINKORA`,
    description: data.description ?? undefined,
  };
}

export default async function CourseSlugPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await tryCreateClient();
  if (!supabase) notFound();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, slug, description, image_file_id, attachment_file_id, external_link")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!course) notFound();

  const [heroSrc, attachHref] = await Promise.all([
    course.image_file_id ? getSignedUrlForPublicFile(course.image_file_id) : Promise.resolve(null),
    course.attachment_file_id ? getSignedUrlForPublicFile(course.attachment_file_id) : Promise.resolve(null),
  ]);
  const ext = course.external_link?.trim();

  return (
    <main className="min-h-[calc(100vh-72px)]">
      {heroSrc ? (
        <div className="relative h-[min(48vh,400px)] w-full overflow-hidden bg-bg-secondary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroSrc} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
            <Container>
              <span className="inline-block rounded-full border border-green-light/40 bg-green-main/20 px-3 py-1 text-xs font-medium text-green-light">
                Curso
              </span>
              <h1 className="mt-4 max-w-4xl font-serif text-3xl text-text-primary sm:text-4xl md:text-5xl">
                {course.title}
              </h1>
            </Container>
          </div>
        </div>
      ) : (
        <div className="border-b border-border bg-gradient-to-br from-green-main/20 via-bg-secondary to-bg-primary py-12 sm:py-16">
          <Container>
            <span className="inline-block rounded-full border border-green-light/40 bg-green-main/15 px-3 py-1 text-xs font-medium text-green-light">
              Curso
            </span>
            <h1 className="mt-4 max-w-4xl font-serif text-3xl text-text-primary sm:text-4xl">{course.title}</h1>
          </Container>
        </div>
      )}

      <Container className="py-10 sm:py-14">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_320px] lg:gap-12">
          <div>
            {course.description ? (
              <p className="text-lg leading-relaxed text-text-secondary">{course.description}</p>
            ) : (
              <p className="text-text-muted">Descrição em breve.</p>
            )}
            <div className="mt-10 flex flex-wrap gap-4">
              {ext ? (
                <a href={ext} target="_blank" rel="noopener noreferrer">
                  <Button variant="green" className="min-h-[48px]">
                    Acessar link do curso
                  </Button>
                </a>
              ) : null}
              {attachHref ? (
                <a href={attachHref} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="min-h-[48px] border-gold text-gold">
                    Baixar material anexo
                  </Button>
                </a>
              ) : null}
            </div>
          </div>
          <aside className="h-fit rounded-2xl border border-border bg-bg-card p-6">
            <h2 className="font-serif text-lg text-text-primary">Sobre este curso</h2>
            <ul className="mt-4 space-y-3 text-sm text-text-secondary">
              <li className="flex gap-2">
                <span className="text-gold">✓</span>
                Conteúdo selecionado pelo time Linkora
              </li>
              <li className="flex gap-2">
                <span className="text-gold">✓</span>
                Materiais complementares quando disponíveis
              </li>
            </ul>
          </aside>
        </div>
        <div className="mx-auto mt-12 max-w-5xl border-t border-border pt-8">
          <Link href="/courses" className="text-sm text-gold hover:underline">
            ← Todos os cursos
          </Link>
        </div>
      </Container>
    </main>
  );
}
