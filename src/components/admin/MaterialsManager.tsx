"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type MaterialRow = {
  id: string;
  title: string;
  attachment_file_id: string | null;
  sort_order: number;
  is_published: boolean;
};

async function uploadDoc(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("purpose", "document");
  const res = await fetch("/api/files/upload", { method: "POST", body: fd });
  const json = (await res.json()) as { file?: { id: string }; error?: string };
  if (!res.ok) throw new Error(json.error ?? "Falha no upload");
  return json.file!.id;
}

export function MaterialsManager() {
  const [items, setItems] = useState<MaterialRow[]>([]);
  const [title, setTitle] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [attachmentFileId, setAttachmentFileId] = useState<string | null>(null);
  const [editing, setEditing] = useState<MaterialRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/materials", { cache: "no-store" });
    const json = (await res.json()) as { materials?: MaterialRow[]; error?: string };
    if (!res.ok) {
      setError(json.error ?? "Erro ao carregar materiais");
      return;
    }
    setItems(json.materials ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  function startEdit(item: MaterialRow) {
    setEditing(item);
    setTitle(item.title);
    setSortOrder(item.sort_order);
    setIsPublished(item.is_published);
    setAttachmentFileId(item.attachment_file_id);
    setError(null);
  }

  function cancelEdit() {
    setEditing(null);
    setTitle("");
    setSortOrder(0);
    setIsPublished(false);
    setAttachmentFileId(null);
  }

  async function saveCreate() {
    setError(null);
    if (!title.trim()) return;
    setLoading(true);
    const res = await fetch("/api/admin/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        sort_order: sortOrder,
        is_published: isPublished,
        attachment_file_id: attachmentFileId,
      }),
    });
    const json = (await res.json()) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? "Erro ao criar material");
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
    const res = await fetch(`/api/admin/materials/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        sort_order: sortOrder,
        is_published: isPublished,
        attachment_file_id: attachmentFileId,
      }),
    });
    const json = (await res.json()) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? "Erro ao salvar material");
      return;
    }
    cancelEdit();
    await load();
  }

  async function togglePublished(item: MaterialRow) {
    const res = await fetch(`/api/admin/materials/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !item.is_published }),
    });
    if (!res.ok) return;
    await load();
  }

  async function remove(item: MaterialRow) {
    const res = await fetch(`/api/admin/materials/${item.id}`, { method: "DELETE" });
    if (!res.ok) return;
    if (editing?.id === item.id) cancelEdit();
    await load();
  }

  const isEditing = Boolean(editing);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-bg-card p-4">
        <h2 className="mb-3 text-lg text-text-primary">
          {isEditing ? "Editar material" : "Novo material"}
        </h2>
        <div className="grid gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            className="min-h-[44px] rounded-lg border border-border bg-bg-primary px-3 text-text-primary outline-none focus:border-gold"
          />
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
                    setAttachmentFileId(await uploadDoc(f));
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Erro no upload");
                  }
                })();
              }}
            />
            {attachmentFileId ? (
              <span className="text-xs text-green-light">Arquivo definido</span>
            ) : (
              <span className="text-xs text-text-muted">Obrigatório para download público</span>
            )}
          </label>
          {attachmentFileId ? (
            <Button type="button" variant="outline" className="w-fit" onClick={() => setAttachmentFileId(null)}>
              Remover arquivo
            </Button>
          ) : null}
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            placeholder="Ordem"
            className="min-h-[44px] max-w-[200px] rounded-lg border border-border bg-bg-primary px-3 text-text-primary outline-none focus:border-gold"
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
                {loading ? "Salvando..." : "Criar material"}
              </Button>
            )}
          </div>
        </div>
        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
      </div>

      <div className="rounded-xl border border-border bg-bg-card p-4">
        <h2 className="mb-3 text-lg text-text-primary">Materiais</h2>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-bg-primary px-3 py-2"
            >
              <div>
                <p className="font-medium text-text-primary">{item.title}</p>
                <p className="text-xs text-text-muted">ordem {item.sort_order}</p>
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
            <p className="text-sm text-text-muted">Nenhum material cadastrado.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
