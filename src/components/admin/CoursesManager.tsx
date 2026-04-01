"use client";

import { useEffect, useState } from "react";
import { AdminAttachmentField } from "@/components/admin/AdminAttachmentField";
import { AdminCardImageField } from "@/components/admin/AdminCardImageField";
import { Button } from "@/components/ui/Button";

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image_file_id: string | null;
  attachment_file_id: string | null;
  external_link: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
};

export function CoursesManager() {
  const [items, setItems] = useState<Course[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [imageFileId, setImageFileId] = useState<string | null>(null);
  const [attachmentFileId, setAttachmentFileId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/courses", { cache: "no-store" });
      const json = (await res.json()) as { courses?: Course[]; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Erro ao carregar cursos");
        return;
      }
      setItems(json.courses ?? []);
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function startEdit(item: Course) {
    setEditing(item);
    setTitle(item.title);
    setDescription(item.description ?? "");
    setExternalLink(item.external_link ?? "");
    setSortOrder(item.sort_order);
    setIsPublished(item.is_published);
    setImageFileId(item.image_file_id);
    setAttachmentFileId(item.attachment_file_id);
    setError(null);
  }

  function cancelEdit() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setExternalLink("");
    setSortOrder(0);
    setIsPublished(false);
    setImageFileId(null);
    setAttachmentFileId(null);
  }

  async function saveCreate() {
    setError(null);
    if (!title.trim()) return;
    setLoading(true);
    const res = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        sort_order: sortOrder,
        is_published: isPublished,
        image_file_id: imageFileId,
        attachment_file_id: attachmentFileId,
        external_link: externalLink.trim() || null,
      }),
    });
    const json = (await res.json()) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? "Erro ao criar curso");
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
    const res = await fetch(`/api/admin/courses/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        sort_order: sortOrder,
        is_published: isPublished,
        image_file_id: imageFileId,
        attachment_file_id: attachmentFileId,
        external_link: externalLink.trim() || null,
      }),
    });
    const json = (await res.json()) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? "Erro ao salvar curso");
      return;
    }
    cancelEdit();
    await load();
  }

  async function togglePublished(item: Course) {
    const res = await fetch(`/api/admin/courses/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !item.is_published }),
    });
    if (!res.ok) return;
    await load();
  }

  async function remove(item: Course) {
    const res = await fetch(`/api/admin/courses/${item.id}`, { method: "DELETE" });
    if (!res.ok) return;
    if (editing?.id === item.id) cancelEdit();
    await load();
  }

  const isEditing = Boolean(editing);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-bg-card p-4">
        <h2 className="mb-3 text-lg text-text-primary">
          {isEditing ? "Editar curso" : "Novo curso"}
        </h2>
        <div className="grid gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do curso"
            className="min-h-[44px] rounded-lg border border-border bg-bg-primary px-3 text-text-primary outline-none focus:border-gold"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição"
            rows={4}
            className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-text-primary outline-none focus:border-gold"
          />
          <input
            value={externalLink}
            onChange={(e) => setExternalLink(e.target.value)}
            placeholder="Link externo (URL)"
            type="url"
            className="min-h-[44px] rounded-lg border border-border bg-bg-primary px-3 text-text-primary outline-none focus:border-gold"
          />
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
            <div className="min-w-0">
              <AdminCardImageField
                fileId={imageFileId}
                onFileIdChange={setImageFileId}
                onError={(msg) => setError(msg)}
              />
            </div>
            <div className="min-w-0">
              <AdminAttachmentField
                fileId={attachmentFileId}
                onFileIdChange={setAttachmentFileId}
                onError={(msg) => setError(msg)}
              />
            </div>
          </div>
          <div className="flex max-w-md flex-col gap-1">
            <label htmlFor="course-sort-order" className="text-sm font-medium text-text-primary">
              Ordem manual (opcional)
            </label>
            <input
              id="course-sort-order"
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="min-h-[44px] max-w-[200px] rounded-lg border border-border bg-bg-primary px-3 text-text-primary outline-none focus:border-gold"
            />
            <p className="text-xs text-text-muted">
              A vitrine usa data de cadastro (mais recente primeiro) e id como desempate. Este número fica gravado para uma futura ordenação manual.
            </p>
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
                {loading ? "Salvando..." : "Criar curso"}
              </Button>
            )}
          </div>
        </div>
        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
      </div>

      <div className="rounded-xl border border-border bg-bg-card p-4">
        <h2 className="mb-3 text-lg text-text-primary">Cursos</h2>
        {listLoading ? (
          <div className="space-y-2" aria-busy="true" aria-label="Carregando lista">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-white/[0.06]" />
            ))}
            <p className="pt-2 text-center text-sm text-text-muted">Carregando…</p>
          </div>
        ) : null}
        {!listLoading ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-bg-primary px-3 py-2"
            >
              <div>
                <p className="font-medium text-text-primary">{item.title}</p>
                <p className="text-xs text-text-muted">
                  {item.slug} · cadastro:{" "}
                  {new Date(item.created_at).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
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
            <p className="text-sm text-text-muted">Nenhum curso cadastrado.</p>
          ) : null}
        </div>
        ) : null}
      </div>
    </div>
  );
}
