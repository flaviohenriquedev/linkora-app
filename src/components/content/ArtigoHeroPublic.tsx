"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";

type Props = {
  imageFileId: string;
  title: string;
  excerpt: string | null;
  publishedLabel: string;
};

export function ArtigoHeroPublic({ imageFileId, title, excerpt, publishedLabel }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    setPhase("loading");
    setUrl(null);
    void (async () => {
      try {
        const res = await fetch(`/api/public/files/${encodeURIComponent(imageFileId)}/url`, { cache: "no-store" });
        const j = (await res.json()) as { url?: string };
        if (!cancelled) {
          if (res.ok && j.url) {
            setUrl(j.url);
            setPhase("ok");
          } else {
            setPhase("error");
          }
        }
      } catch {
        if (!cancelled) setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [imageFileId]);

  if (phase === "loading") {
    return (
      <div className="flex h-[min(52vh,420px)] w-full items-center justify-center bg-bg-secondary">
        <p className="text-sm text-text-muted">Carregando capa…</p>
      </div>
    );
  }

  if (phase === "error" || !url) {
    return (
      <div className="border-b border-border bg-gradient-to-br from-bg-secondary to-bg-primary py-12 sm:py-16">
        <Container>
          <p className="text-xs font-medium uppercase tracking-wider text-gold">{publishedLabel}</p>
          <h1 className="mt-2 max-w-4xl font-serif text-3xl text-text-primary sm:text-4xl">{title}</h1>
          {excerpt ? <p className="mt-4 max-w-2xl text-text-secondary">{excerpt}</p> : null}
        </Container>
      </div>
    );
  }

  return (
    <div className="relative h-[min(52vh,420px)] w-full overflow-hidden bg-bg-secondary">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
        <Container>
          <p className="text-xs font-medium uppercase tracking-wider text-gold">{publishedLabel}</p>
          <h1 className="mt-2 max-w-4xl font-serif text-3xl text-text-primary sm:text-4xl md:text-5xl">{title}</h1>
          {excerpt ? <p className="mt-4 max-w-2xl text-lg text-text-secondary">{excerpt}</p> : null}
        </Container>
      </div>
    </div>
  );
}
