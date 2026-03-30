"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  is_published: boolean;
  published_at: string | null;
};

export function BlogPostsManager() {
  const [items, setItems] = useState<BlogPost[]>([]);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/blog-posts", { cache: "no-store" });
    const json = (await res.json()) as { posts?: BlogPost[]; error?: string };
    if (!res.ok) {
      setError(json.error ?? "Erro ao carregar posts");
      return;
    }
    setItems(json.posts ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  function startEdit(item: BlogPost) {
    setEditing(item);
    setTitle(item.title);
    setExcerpt(item.excerpt ?? "");
    setBody(item.body ?? "");
    setIsPublished(item.is_published);
    setError(null);
  }

  function cancelEdit() {
    setEditing(null);
    setTitle("");
    setExcerpt("");
    setBody("");
    setIsPublished(false);
  }

  async function saveCreate() {
    setError(null);
    if (!title.trim()) return;
    setLoading(true);
    const res = await fetch("/api/admin/blog-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        excerpt,
        body,
        is_published: isPublished,
      }),
    });
    const json = (await res.json()) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? "Erro ao criar post");
      return;
    }
    cancelEdit();
    await load();
  }

  async function saveEdit() {
    if (!editing) return;
    setError(null);
    if (!title.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/admin/blog-posts/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        excerpt,
        body,
        is_published: isPublished,
      }),
    });
    const json = (await res.json()) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? "Erro ao salvar post");
      return;
    }
    cancelEdit();
    await load();
  }

  async function togglePublished(item: BlogPost) {
    const res = await fetch(`/api/admin/blog-posts/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !item.is_published }),
    });
    if (!res.ok) return;
    await load();
  }

  async function remove(item: BlogPost) {
    const res = await fetch(`/api/admin/blog-posts/${item.id}`, { method: "DELETE" });
    if (!res.ok) return;
    if (editing?.id === item.id) cancelEdit();
    await load();
  }

  const isEditing = Boolean(editing);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-bg-card p-4">
        <h2 className="mb-3 text-lg text-text-primary">
          {isEditing ? "Editar post" : "Novo post"}
        </h2>
        <div className="grid gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            className="min-h-[44px] rounded-lg border border-border bg-bg-primary px-3 text-text-primary outline-none focus:border-gold"
          />
          <input
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Resumo / chamada (opcional)"
            className="min-h-[44px] rounded-lg border border-border bg-bg-primary px-3 text-text-primary outline-none focus:border-gold"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Conteúdo (Markdown ou texto puro)"
            rows={8}
            className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-text-primary outline-none focus:border-gold"
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Publicado
          </label>
          <div className="flex flex-wrap gap-2">
            {isEditing ? (
              <>
                <Button variant="gold" disabled={loading} onClick={() => void saveEdit()}>
                  {loading ? "Salvando..." : "Salvar alterações"}
                </Button>
                <Button variant="outline" disabled={loading} onClick={cancelEdit}>
                  Cancelar
                </Button>
              </>
            ) : (
              <Button variant="gold" disabled={loading} onClick={() => void saveCreate()}>
                {loading ? "Salvando..." : "Criar post"}
              </Button>
            )}
          </div>
        </div>
        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
      </div>

      <div className="rounded-xl border border-border bg-bg-card p-4">
        <h2 className="mb-3 text-lg text-text-primary">Posts</h2>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-bg-primary px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-text-primary">{item.title}</p>
                <p className="truncate text-xs text-text-muted">{item.slug}</p>
                {item.excerpt ? (
                  <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{item.excerpt}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => void togglePublished(item)}>
                  {item.is_published ? "Despublicar" : "Publicar"}
                </Button>
                <Button variant="outline" onClick={() => startEdit(item)}>
                  Editar
                </Button>
                <Button variant="outline" onClick={() => void remove(item)}>
                  Excluir
                </Button>
              </div>
            </div>
          ))}
          {items.length === 0 ? (
            <p className="text-sm text-text-muted">Nenhum post cadastrado.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
