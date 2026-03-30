import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

const purposes = new Set(["profile_avatar", "product_image", "document", "other"]);

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
  if (!ALLOWED.has(mime)) {
    return NextResponse.json(
      { error: "Tipo não permitido (use JPEG, PNG ou WebP)" },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Arquivo muito grande (máx. 5 MB)" }, { status: 400 });
  }

  const ext =
    mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
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
      purpose,
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
