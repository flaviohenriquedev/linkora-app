"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ImageCropModal } from "@/components/profile/ImageCropModal";
import {
  PORTFOLIO_CROP_ASPECT_OPTIONS,
  portfolioCropAspectClass,
  type PortfolioCropAspect,
} from "@/lib/portfolio-crop-aspect";
import { ensureJpegUnderPortfolioUploadLimit } from "@/lib/portfolio-image";

type PortfolioPost = {
  id: string;
  caption: string | null;
  sort_order: number;
  is_public: boolean;
  created_at: string;
  image_file_id: string;
  imageUrl: string | null;
  crop_aspect: PortfolioCropAspect;
};

export function ProviderPortfolioTab() {
  const [posts, setPosts] = useState<PortfolioPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [draftCaption, setDraftCaption] = useState("");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editCaptionDraft, setEditCaptionDraft] = useState("");
  const [editCaptionError, setEditCaptionError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile/portfolio", { cache: "no-store" });
      const json = (await res.json()) as { posts?: PortfolioPost[] };
      setPosts(json.posts ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (sourceImage) URL.revokeObjectURL(sourceImage);
    };
  }, [sourceImage]);

  async function confirmCropAndPublish(blob: Blob, meta?: { crop_aspect: PortfolioCropAspect }) {
    if (!sourceImage) return;
    setBusy(true);
    setPublishError(null);
    try {
      let uploadBlob: Blob;
      try {
        uploadBlob = await ensureJpegUnderPortfolioUploadLimit(blob);
      } catch (prepErr) {
        setPublishError(prepErr instanceof Error ? prepErr.message : "Não foi possível preparar a imagem.");
        return;
      }

      const fd = new FormData();
      fd.append("file", new File([uploadBlob], "portfolio.jpg", { type: "image/jpeg" }));
      fd.append("purpose", "provider_portfolio");

      const up = await fetch("/api/files/upload", { method: "POST", body: fd });
      const upJson = (await up.json()) as { file?: { id: string }; error?: string };
      if (!up.ok || !upJson.file?.id) {
        setPublishError(upJson.error ?? "Não foi possível enviar a foto. Tente de novo.");
        return;
      }

      const cap = draftCaption.trim().slice(0, 2000);
      const postRes = await fetch("/api/profile/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_file_id: upJson.file.id,
          caption: cap.length ? cap : null,
          is_public: true,
          crop_aspect: meta?.crop_aspect ?? "1_1",
        }),
      });
      const postJson = (await postRes.json()) as { error?: string };
      if (!postRes.ok) {
        setPublishError(postJson.error ?? "Não foi possível publicar no portfólio.");
        return;
      }

      URL.revokeObjectURL(sourceImage);
      setSourceImage(null);
      setDraftCaption("");
      setPublishError(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function performDeletePost() {
    if (!deletePostId) return;
    setBusy(true);
    try {
      await fetch(`/api/profile/portfolio/${encodeURIComponent(deletePostId)}`, { method: "DELETE" });
      setDeletePostId(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function togglePublic(p: PortfolioPost) {
    setBusy(true);
    try {
      await fetch(`/api/profile/portfolio/${encodeURIComponent(p.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_public: !p.is_public }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  function openEditCaption(p: PortfolioPost) {
    setEditCaptionError(null);
    setEditingPostId(p.id);
    setEditCaptionDraft(p.caption ?? "");
  }

  function closeEditCaption() {
    setEditingPostId(null);
    setEditCaptionDraft("");
    setEditCaptionError(null);
  }

  async function saveEditCaption() {
    if (!editingPostId) return;
    setBusy(true);
    setEditCaptionError(null);
    try {
      const res = await fetch(`/api/profile/portfolio/${encodeURIComponent(editingPostId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: editCaptionDraft.trim() ? editCaptionDraft.trim() : null }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setEditCaptionError(json.error ?? "Não foi possível salvar a legenda.");
        return;
      }
      closeEditCaption();
      await load();
    } catch {
      setEditCaptionError("Não foi possível salvar a legenda. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-medium text-text-primary">Portfólio</h2>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">
            Você pode adicionar legenda e escolher a proporção do recorte (1:1, 3:4 ou 9:16). As fotos
            aparecem no seu perfil público, sem curtidas nem comentários.
          </p>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              if (sourceImage) URL.revokeObjectURL(sourceImage);
              setPublishError(null);
              setSourceImage(URL.createObjectURL(f));
            }}
          />
          <Button
            type="button"
            variant="gold"
            className="min-h-[44px] w-full sm:w-auto"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            Adicionar foto
          </Button>
        </div>
      </div>

      <ImageCropModal
        imageSrc={sourceImage}
        title="Nova foto no portfólio"
        cropShape="rect"
        aspectOptions={PORTFOLIO_CROP_ASPECT_OPTIONS}
        cropFrameClassName="min-h-[280px] h-[min(65dvh,520px)]"
        confirmLabel={busy ? "Publicando…" : "Publicar foto"}
        busy={busy}
        onClose={() => {
          if (sourceImage) URL.revokeObjectURL(sourceImage);
          setSourceImage(null);
          setDraftCaption("");
          setPublishError(null);
        }}
        onConfirm={(blob, meta) => void confirmCropAndPublish(blob, meta)}
      >
        {publishError ? (
          <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
            {publishError}
          </p>
        ) : null}
        <label className="mb-1.5 mt-4 block text-xs font-medium text-text-muted" htmlFor="portfolio-caption">
          Legenda (opcional)
        </label>
        <textarea
          id="portfolio-caption"
          value={draftCaption}
          onChange={(e) => setDraftCaption(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Descreva o trabalho, materiais, ocasião..."
          disabled={busy}
          className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-secondary outline-none focus:border-gold disabled:opacity-60"
        />
      </ImageCropModal>

      {editingPostId ? (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/70 p-4">
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-bg-card p-4 shadow-lg"
            role="dialog"
            aria-labelledby="edit-caption-title"
          >
            <h3 id="edit-caption-title" className="text-base font-medium text-text-primary">
              Editar legenda
            </h3>
            <p className="mt-1 text-xs text-text-muted">Até 2.000 caracteres. Deixe em branco para remover a legenda.</p>
            <label className="sr-only" htmlFor="edit-portfolio-caption">
              Legenda
            </label>
            <textarea
              id="edit-portfolio-caption"
              value={editCaptionDraft}
              onChange={(e) => setEditCaptionDraft(e.target.value)}
              rows={4}
              maxLength={2000}
              disabled={busy}
              className="mt-3 w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-secondary outline-none focus:border-gold disabled:opacity-60"
            />
            <p className="mt-1 text-right text-xs text-text-muted">{editCaptionDraft.length}/2000</p>
            {editCaptionError ? <p className="mt-2 text-sm text-red-400">{editCaptionError}</p> : null}
            <div className="mt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" disabled={busy} onClick={closeEditCaption}>
                Cancelar
              </Button>
              <Button type="button" variant="gold" disabled={busy} onClick={() => void saveEditCaption()}>
                {busy ? "Salvando…" : "Salvar legenda"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {deletePostId ? (
        <div
          className="fixed inset-0 z-[1450] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={() => !busy && setDeletePostId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-portfolio-title"
            aria-describedby="delete-portfolio-desc"
            className="w-full max-w-md rounded-2xl border border-border bg-bg-card p-5 shadow-xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-portfolio-title" className="font-serif text-lg font-medium text-text-primary">
              Remover foto do portfólio?
            </h3>
            <p id="delete-portfolio-desc" className="mt-3 text-[15px] leading-relaxed text-text-secondary">
              A foto será apagada de forma permanente. Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="min-h-[44px]"
                disabled={busy}
                onClick={() => setDeletePostId(null)}
              >
                Cancelar
              </Button>
              <button
                type="button"
                className="min-h-[44px] rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-[15px] font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                disabled={busy}
                onClick={() => void performDeletePost()}
              >
                {busy ? "Removendo…" : "Remover"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-text-muted">Carregando portfólio...</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-text-muted">Nenhuma foto ainda. Clique em &quot;Adicionar foto&quot;.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <li
              key={p.id}
              className="overflow-hidden rounded-xl border border-border bg-bg-card shadow-sm"
            >
              <div className={`w-full bg-bg-primary ${portfolioCropAspectClass(p.crop_aspect)}`}>
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- URL assinada
                  <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-text-muted">Sem miniatura</div>
                )}
              </div>
              {p.caption?.trim() ? (
                <p className="border-t border-border px-3 py-2 text-sm text-text-secondary">{p.caption}</p>
              ) : (
                <p className="border-t border-border px-3 py-2 text-xs italic text-text-muted">Sem legenda</p>
              )}
              <div className="flex flex-wrap gap-2 border-t border-border px-3 py-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => openEditCaption(p)}
                  className="rounded-lg border border-border px-2 py-1.5 text-xs text-text-secondary transition hover:bg-bg-primary"
                >
                  Editar legenda
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void togglePublic(p)}
                  className="rounded-lg border border-border px-2 py-1.5 text-xs text-text-secondary transition hover:bg-bg-primary"
                >
                  {p.is_public ? "Ocultar no perfil público" : "Mostrar no perfil público"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setDeletePostId(p.id)}
                  className="rounded-lg border border-border px-2 py-1.5 text-xs text-red-400/90 transition hover:bg-red-500/10"
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
