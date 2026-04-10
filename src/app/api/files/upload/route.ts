import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_IMAGES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
/** Portfólio: recortes em alta resolução podem gerar JPEG grande; limite um pouco maior após compressão no cliente. */
const MAX_PORTFOLIO_IMAGE_BYTES = 8 * 1024 * 1024;

const ALLOWED_DOCS = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
]);
const MAX_DOC_BYTES = 25 * 1024 * 1024;

const purposes = new Set(["profile_avatar", "product_image", "provider_portfolio", "document", "other"]);

function extForMime(mime: string): string {
  const m: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/zip": "zip",
    "application/x-zip-compressed": "zip",
    "text/plain": "txt",
  };
  return m[mime] ?? "bin";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Campo file obrigatório" }, { status: 400 });
  }

  const purposeRaw = formData.get("purpose");
  const purpose =
    typeof purposeRaw === "string" && purposes.has(purposeRaw) ? purposeRaw : "other";

  const mime = file.type || "application/octet-stream";
  const isImage = ALLOWED_IMAGES.has(mime);
  let maxBytes = MAX_IMAGE_BYTES;
  let purposeResolved = purpose as "profile_avatar" | "product_image" | "provider_portfolio" | "document" | "other";

  if (purposeResolved === "provider_portfolio") {
    const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (prof?.role !== "provider") {
      return NextResponse.json({ error: "Apenas prestadores podem enviar fotos de portfólio" }, { status: 403 });
    }
    maxBytes = MAX_PORTFOLIO_IMAGE_BYTES;
  }

  if (!isImage) {
    const { isAdmin } = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Apenas administradores podem enviar documentos (PDF, Office, etc.)" },
        { status: 403 },
      );
    }
    if (!ALLOWED_DOCS.has(mime)) {
      return NextResponse.json(
        { error: "Tipo de documento não permitido (PDF, Office, ZIP ou TXT)" },
        { status: 400 },
      );
    }
    maxBytes = MAX_DOC_BYTES;
    purposeResolved = "document";
  }

  if (file.size > maxBytes) {
    const mb = maxBytes / (1024 * 1024);
    return NextResponse.json(
      { error: `Arquivo muito grande (máximo ${mb} MB).` },
      { status: 400 },
    );
  }

  const ext = extForMime(mime);
  const fileId = crypto.randomUUID();
  const bucket = "linkora-files";
  const storagePath = `${user.id}/${fileId}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upError } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
    contentType: mime,
    upsert: true,
  });

  if (upError) {
    return NextResponse.json({ error: upError.message }, { status: 500 });
  }

  const { data: row, error: insertError } = await supabase
    .from("files")
    .insert({
      user_id: user.id,
      bucket,
      storage_path: storagePath,
      mime_type: mime,
      byte_size: file.size,
      purpose: purposeResolved,
      linked_entity_type: null,
      linked_entity_id: null,
    })
    .select("id, storage_path, bucket, purpose, mime_type, byte_size, created_at")
    .single();

  if (insertError) {
    await supabase.storage.from(bucket).remove([storagePath]);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: signed } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 3600);

  return NextResponse.json({
    file: row,
    signedUrl: signed?.signedUrl ?? null,
  });
}
