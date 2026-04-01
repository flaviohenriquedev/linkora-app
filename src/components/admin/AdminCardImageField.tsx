"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { uploadAdminProductImage } from "@/lib/admin-file-upload";

type Props = {
    fileId: string | null;
    onFileIdChange: (id: string | null) => void;
    label?: string;
    hintWhenEmpty?: string;
    hintWhenSet?: string;
    onError?: (message: string) => void;
};

/**
 * Imagem de capa para cards (blog, curso, etc.): upload, preview com URL assinada e remover.
 */
export function AdminCardImageField({
                                        fileId,
                                        onFileIdChange,
                                        label = "Imagem do card",
                                        hintWhenEmpty = "Opcional · JPEG, PNG ou WebP",
                                        hintWhenSet = "Imagem definida",
                                        onError,
                                    }: Props) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!fileId) {
            setPreviewUrl(null);
            return;
        }
        let cancelled = false;
        void (async () => {
            try {
                const res = await fetch(`/api/admin/files/${encodeURIComponent(fileId)}/signed`, {
                    cache: "no-store",
                });
                const j = (await res.json()) as { url?: string };
                if (!cancelled && res.ok && j.url) setPreviewUrl(j.url);
            } catch {
                if (!cancelled) setPreviewUrl(null);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [fileId]);

    return (
        <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer flex-col gap-1 text-sm text-text-secondary">
                <span className="font-medium text-text-primary">{label}</span>
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
                                const { id, signedUrl } = await uploadAdminProductImage(f);
                                onFileIdChange(id);
                                setPreviewUrl(signedUrl);
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
            {previewUrl ? (
                <div className="overflow-hidden rounded-xl border border-border bg-bg-primary">
                    {/* eslint-disable-next-line @next/next/no-img-element -- URL assinada */}
                    <img src={previewUrl} alt="" className="max-h-56 w-full object-contain" />
                </div>
            ) : null}
            {fileId ? (
                <Button
                    type="button"
                    variant="outline"
                    className="w-fit"
                    onClick={() => {
                        onFileIdChange(null);
                        setPreviewUrl(null);
                    }}
                >
                    Remover imagem
                </Button>
            ) : null}
        </div>
    );
}
