"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { publicFileRedirectUrl } from "@/lib/publicFileUrl";

type Material = {
  id: string;
  title: string;
  attachment_file_id: string | null;
  sort_order: number;
};

export function MateriaisPublicClient() {
  const [items, setItems] = useState<Material[]>([]);
  const [open, setOpen] = useState<Material | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/public/materials", { cache: "no-store" });
    const j = (await res.json()) as { materials?: Material[] };
    setItems(j.materials ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const fileHref = open?.attachment_file_id ? publicFileRedirectUrl(open.attachment_file_id) : null;

  return (
    <>
      <Container className="py-10 sm:py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setOpen(m)}
              className="flex min-h-[120px] flex-col items-start rounded-2xl border border-border bg-bg-card p-6 text-left transition hover:border-gold"
            >
              <span className="font-serif text-lg text-text-primary">{m.title}</span>
              <span className="mt-3 text-sm text-gold">Abrir material →</span>
            </button>
          ))}
        </div>
        {items.length === 0 ? (
          <p className="text-center text-text-muted">Nenhum material publicado ainda.</p>
        ) : null}
      </Container>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
              role="presentation"
              onClick={() => setOpen(null)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="mat-title"
                className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-bg-card shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
                  <h2 id="mat-title" className="font-serif text-xl text-text-primary">
                    {open.title}
                  </h2>
                  <button
                    type="button"
                    aria-label="Fechar"
                    className="shrink-0 rounded-lg p-2 text-text-muted hover:bg-bg-primary hover:text-gold"
                    onClick={() => setOpen(null)}
                  >
                    ✕
                  </button>
                </div>
                <div className="min-h-[200px] flex-1 overflow-auto p-6">
                  {fileHref ? (
                    <div className="space-y-4">
                      <div className="overflow-hidden rounded-xl border border-border bg-bg-primary">
                        <iframe title="Pré-visualização" src={fileHref} className="h-[min(60vh,560px)] w-full" />
                      </div>
                      <p className="text-xs text-text-muted">
                        Se o arquivo não abrir embutido, use o botão abaixo para baixar ou abrir em nova aba.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <a href={fileHref} target="_blank" rel="noopener noreferrer">
                          <Button variant="gold">Abrir em nova aba / baixar</Button>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-text-muted">Nenhum arquivo anexado a este material.</p>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
