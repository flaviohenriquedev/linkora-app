"use client";

import { useEffect, useState } from "react";

type Props = {
  fileId: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
};

/**
 * Carrega URL assinada via API (igual ao fluxo do avatar: img com URL direta do Storage).
 */
export function PublicFileCover({ fileId, alt = "", className = "", imgClassName = "" }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    setPhase("loading");
    void (async () => {
      try {
        const res = await fetch(`/api/public/files/${encodeURIComponent(fileId)}/url`, { cache: "no-store" });
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
  }, [fileId]);

  if (phase === "loading") {
    return (
      <div
        className={`flex aspect-[16/10] w-full animate-pulse items-center justify-center bg-bg-secondary ${className}`}
      />
    );
  }

  if (phase === "error" || !url) {
    return (
      <div
        className={`flex aspect-[16/10] w-full items-center justify-center bg-bg-secondary text-xs text-text-muted ${className}`}
      >
        Imagem indisponível
      </div>
    );
  }

  return (
    <div className={`relative aspect-[16/10] w-full overflow-hidden bg-bg-secondary ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} className={`h-full w-full object-cover ${imgClassName}`} />
    </div>
  );
}
