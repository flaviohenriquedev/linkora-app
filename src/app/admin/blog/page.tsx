import { Container } from "@/components/ui/Container";
import { BlogPostsManager } from "@/components/admin/BlogPostsManager";

export default function AdminBlogPage() {
  return (
    <main className="min-h-[calc(100vh-72px)]">
      <Container className="py-10">
        <h1 className="font-serif text-3xl text-text-primary">Blog</h1>
        <p className="mt-2 max-w-2xl text-text-secondary">
          Crie e publique artigos. O conteúdo pode ser texto puro ou Markdown conforme o site público for implementado.
        </p>
        <div className="mt-6">
          <BlogPostsManager />
        </div>
      </Container>
    </main>
  );
}
