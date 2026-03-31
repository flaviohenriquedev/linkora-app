"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  image_file_id: string | null;
  attachment_file_id: string | null;
  is_published: boolean;
  published_at: string | null;
};

async function uploadFile(file: File, asImage: boolean) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("purpose", asImage ? "product_image" : "document");
  const res = await fetch("/api/files/upload", { method: "POST", body: fd });
  const json = (await res.json()) as { file?: { id: string }; error?: string; signedUrl?: string | null };
  if (!res.ok) throw new Error(json.error ?? "Falha no upload");
  return json.file!.id;
}

export function ArticlesManager() {
  const [items, setItems] = useState<ArticleRow[]>([]);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [imageFileId, setImageFileId] = useState<string | null>(null);
  const [attachmentFileId, setAttachmentFileId] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [editing, setEditing] = useState<ArticleRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/blog-posts", { cache: "no-store" });
    const json = (await res.json()) as { posts?: ArticleRow[]; error?: string };
    if (!res.ok) {
      setError(json.error ?? "Erro ao carregar artigos");
      return;
    }
    setItems(json.posts ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  function startEdit(item: ArticleRow) {
    setEditing(item);
    setTitle(item.title);
    setExcerpt(item.excerpt ?? "");
    setBody(item.body ?? "");
    setImageFileId(item.image_file_id);
    setAttachmentFileId(item.attachment_file_id);
    setIsPublished(item.is_published);
    setError(null);
  }

  function cancelEdit() {
    setEditing(null);
    setTitle("");
    setExcerpt("");
    setBody("");
    setImageFileId(null);
    setAttachmentFileId(null);
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
        image_file_id: imageFileId,
        attachment_file_id: attachmentFileId,
      }),
    });
    const json = (await res.json()) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? "Erro ao criar artigo");
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
        image_file_id: imageFileId,
        attachment_file_id: attachmentFileId,
      }),
    });
    const json = (await res.json()) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? "Erro ao salvar artigo");
      return;
    }
    cancelEdit();
    await load();
  }

  async function togglePublished(item: ArticleRow) {
    const res = await fetch(`/api/admin/blog-posts/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !item.is_published }),
    });
    if (!res.ok) return;
    await load();
  }

  async function remove(item: ArticleRow) {
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
          {isEditing ? "Editar artigo" : "Novo artigo"}
        </h2>
        <div className="grid gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            className="min-h-[44px] rounded-lg border border-border bg-bg-primary px-3 text-text-primary outline-none focus:border-gold"
          />
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Descrição (resumo para cards)"
            rows={3}
            className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-text-primary outline-none focus:border-gold"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Conteúdo completo (texto para a página do artigo)"
            rows={10}
            className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-text-primary outline-none focus:border-gold"
          />
          <div className="flex flex-wrap gap-4">
            <label className="flex cursor-pointer flex-col gap-1 text-sm text-text-secondary">
              <span className="font-medium text-text-primary">Imagem do card</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="max-w-full text-sm"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  void (async () => {
                    try {
                      const id = await uploadFile(f, true);
                      setImageFileId(id);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Erro no upload");
                    }
                  })();
                }}
              />
              {imageFileId ? (
                <span className="text-xs text-green-light">Imagem definida · </span>
              ) : (
                <span className="text-xs text-text-muted">Opcional · JPEG, PNG ou WebP</span>
              )}
            </label>
            <label className="flex cursor-pointer flex-col gap-1 text-sm text-text-secondary">
              <span className="font-medium text-text-primary">Arquivo anexado</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.zip,application/pdf"
                className="max-w-full text-sm"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  void (async () => {
                    try {
                      const id = await uploadFile(f, false);
                      setAttachmentFileId(id);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Erro no upload");
                    }
                  })();
                }}
              />
              {attachmentFileId ? (
                <span className="text-xs text-green-light">Anexo definido</span>
              ) : (
                <span className="text-xs text-text-muted">PDF, Office, ZIP…</span>
              )}
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {imageFileId ? (
              <Button type="button" variant="outline" onClick={() => setImageFileId(null)}>
                Remover imagem
              </Button>
            ) : null}
            {attachmentFileId ? (
              <Button type="button" variant="outline" onClick={() => setAttachmentFileId(null)}>
                Remover anexo
              </Button>
            ) : null}
          </div>
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
                {loading ? "Salvando..." : "Criar artigo"}
              </Button>
            )}
          </div>
        </div>
        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
      </div>

      <div className="rounded-xl border border-border bg-bg-card p-4">
        <h2 className="mb-3 text-lg text-text-primary">Artigos</h2>
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
                <p className="mt-1 text-xs text-text-muted">
                  {[item.image_file_id ? "Imagem" : null, item.attachment_file_id ? "Anexo" : null]
                    .filter(Boolean)
                    .join(" · ") || "Sem mídia"}
                </p>
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
            <p className="text-sm text-text-muted">Nenhum artigo cadastrado.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
