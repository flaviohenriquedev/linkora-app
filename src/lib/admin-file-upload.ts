/** Uploads usados no painel admin (artigos, cursos, etc.). */

export async function uploadAdminProductImage(
  file: File,
): Promise<{ id: string; signedUrl: string | null }> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("purpose", "product_image");
  const res = await fetch("/api/files/upload", { method: "POST", body: fd });
  const json = (await res.json()) as { file?: { id: string }; error?: string; signedUrl?: string | null };
  if (!res.ok || !json.file?.id) throw new Error(json.error ?? "Falha no upload");
  return { id: json.file.id, signedUrl: json.signedUrl ?? null };
}

export async function uploadAdminDocument(file: File): Promise<{
  id: string;
  signedUrl: string | null;
  mimeType: string;
}> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("purpose", "document");
  const res = await fetch("/api/files/upload", { method: "POST", body: fd });
  const json = (await res.json()) as {
    file?: { id: string };
    error?: string;
    signedUrl?: string | null;
  };
  if (!res.ok || !json.file?.id) throw new Error(json.error ?? "Falha no upload");
  return {
    id: json.file.id,
    signedUrl: json.signedUrl ?? null,
    mimeType: file.type || "application/octet-stream",
  };
}
