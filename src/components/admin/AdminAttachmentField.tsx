"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { uploadAdminDocument } from "@/lib/admin-file-upload";

type Props = {
  fileId: string | null;
  onFileIdChange: (id: string | null) => void;
  label?: string;
  hintWhenEmpty?: string;
  hintWhenSet?: string;
  removeButtonLabel?: string;
  onError?: (message: string) => void;
};

function isPdfMime(m: string | null, url: string | null) {
  if (m === "application/pdf") return true;
  if (!url) return false;
  try {
    return new URL(url).pathname.toLowerCase().includes(".pdf");
  } catch {
    return /\.pdf(\?|#|$)/i.test(url);
  }
}

function isImageMime(m: string | null) {
  return Boolean(m && m.startsWith("image/"));
}

/**
 * Anexo (PDF, Office, etc.) no admin: upload, pré-visualização quando possível, remover.
 */
export function AdminAttachmentField({
  fileId,
  onFileIdChange,
  label = "Arquivo anexado",
  hintWhenEmpty = "PDF, Office, ZIP…",
  hintWhenSet = "Anexo definido",
  removeButtonLabel = "Remover anexo",
  onError,
}: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "loading">("idle");

  useEffect(() => {
    if (!fileId) {
      setPreviewUrl(null);
      setMimeType(null);
      return;
    }
    let cancelled = false;
    setPhase("loading");
    void (async () => {
      try {
        const res = await fetch(`/api/admin/files/${encodeURIComponent(fileId)}/signed`, {
          cache: "no-store",
        });
        const j = (await res.json()) as { url?: string; mimeType?: string | null };
        if (!cancelled) {
          if (res.ok && j.url) {
            setPreviewUrl(j.url);
            setMimeType(j.mimeType ?? null);
          } else {
            setPreviewUrl(null);
            setMimeType(null);
          }
        }
      } catch {
        if (!cancelled) {
          setPreviewUrl(null);
          setMimeType(null);
        }
      } finally {
        if (!cancelled) setPhase("idle");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  const showPdf = isPdfMime(mimeType, previewUrl);
  const showImage = isImageMime(mimeType);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <label className="flex cursor-pointer flex-col gap-1 text-sm text-text-secondary">
        <span className="font-medium text-text-primary">{label}</span>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,application/pdf"
          className="max-w-full text-sm"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            void (async () => {
              try {
                const { id, signedUrl, mimeType: mt } = await uploadAdminDocument(f);
                onFileIdChange(id);
                if (signedUrl) {
                  setPreviewUrl(signedUrl);
                  setMimeType(mt);
                }
              } catch (err) {
                onError?.(err instanceof Error ? err.message : "Erro no upload");
              }
            })();
          }}
        />
        <span className={`text-xs ${fileId ? "text-green-light" : "text-text-muted"}`}>
          {fileId ? hintWhenSet : hintWhenEmpty}
        </span>
      </label>

      {fileId && phase === "loading" && !previewUrl ? (
        <p className="text-xs text-text-muted">Carregando pré-visualização…</p>
      ) : null}

      {previewUrl && showImage ? (
        <div className="overflow-hidden rounded-xl border border-border bg-bg-primary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="" className="max-h-56 w-full object-contain" />
        </div>
      ) : null}

      {previewUrl && showPdf ? (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-xl border border-border bg-bg-primary">
            <iframe title="Pré-visualização PDF" src={previewUrl} className="h-52 w-full" />
          </div>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gold hover:underline"
          >
            Abrir PDF em nova aba
          </a>
        </div>
      ) : null}

      {previewUrl && !showPdf && !showImage ? (
        <div className="rounded-xl border border-border bg-bg-primary px-4 py-3 text-sm text-text-secondary">
          <p className="mb-2">Pré-visualização embutida não disponível para este tipo de arquivo.</p>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
            Abrir ou baixar em nova aba →
          </a>
        </div>
      ) : null}

      {fileId ? (
        <Button
          type="button"
          variant="outline"
          className="mt-auto w-fit"
          onClick={() => {
            onFileIdChange(null);
            setPreviewUrl(null);
            setMimeType(null);
          }}
        >
          {removeButtonLabel}
        </Button>
      ) : null}
    </div>
  );
}
