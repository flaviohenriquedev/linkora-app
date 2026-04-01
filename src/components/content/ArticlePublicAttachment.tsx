"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  fileId: string;
};

/**
 * Anexo público: URL assinada no cliente (PDF no iframe quando possível).
 */
export function ArticlePublicAttachment({ fileId }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const res = await fetch(`/api/public/files/${encodeURIComponent(fileId)}/url`, { cache: "no-store" });
        const j = (await res.json()) as { url?: string };
        if (!cancelled) {
          setUrl(res.ok && j.url ? j.url : null);
        }
      } catch {
        if (!cancelled) setUrl(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  if (loading) {
    return (
      <div className="mt-10 rounded-2xl border border-gold/30 bg-[rgba(201,168,76,0.08)] p-6">
        <p className="text-sm text-text-muted">Carregando anexo…</p>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="mt-10 rounded-2xl border border-border bg-bg-card p-6">
        <p className="text-sm text-text-muted">Não foi possível carregar o anexo. Tente mais tarde.</p>
      </div>
    );
  }

  const isPdf = (() => {
    try {
      return new URL(url).pathname.toLowerCase().includes(".pdf");
    } catch {
      return /\.pdf(\?|#|$)/i.test(url);
    }
  })();

  return (
    <div className="mt-10 rounded-2xl border border-gold/30 bg-[rgba(201,168,76,0.08)] p-6">
      <p className="text-sm font-medium text-gold">Material para download</p>
      {isPdf ? (
        <div className="mt-4 space-y-3">
          <div className="overflow-hidden rounded-xl border border-border bg-bg-primary">
            <iframe title="Pré-visualização do PDF" src={url} className="h-[min(55vh,520px)] w-full" />
          </div>
          <p className="text-xs text-text-muted">
            Se não aparecer no navegador, use o botão para abrir ou baixar em nova aba.
          </p>
        </div>
      ) : null}
      <div className={`flex flex-wrap gap-3 ${isPdf ? "mt-4" : "mt-3"}`}>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button variant="gold" className="min-h-[44px]">
            {isPdf ? "Abrir em nova aba / baixar" : "Abrir / baixar anexo"}
          </Button>
        </a>
      </div>
    </div>
  );
}
