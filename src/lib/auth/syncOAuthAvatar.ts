import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Se o usuário entrou com Google e ainda não tem avatar no Storage,
 * baixa a URL do provedor e grava em `files` + `profiles.avatar_file_id`.
 */
export async function syncOAuthAvatarIfMissing(
  supabase: SupabaseClient,
  user: User,
): Promise<void> {
  const meta = user.user_metadata ?? {};
  const pictureUrl =
    typeof meta.picture === "string"
      ? meta.picture
      : typeof meta.avatar_url === "string"
        ? meta.avatar_url
        : null;
  if (!pictureUrl) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_file_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.avatar_file_id) return;

  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 15_000);
  let res: Response;
  try {
    res = await fetch(pictureUrl, {
      headers: {
        Accept: "image/*",
        "User-Agent": "LinkoraApp/1.0 (avatar sync)",
      },
      signal: ctrl.signal,
    });
  } catch {
    clearTimeout(tid);
    return;
  }
  clearTimeout(tid);
  if (!res.ok) return;

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0 || buf.length > MAX_BYTES) return;

  let mime = res.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!mime || !ALLOWED.has(mime)) {
    if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8) mime = "image/jpeg";
    else if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
      mime = "image/png";
    else if (buf.length >= 12 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46)
      mime = "image/webp";
    else mime = "image/jpeg";
  }
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const fileId = crypto.randomUUID();
  const bucket = "linkora-files";
  const storagePath = `${user.id}/${fileId}.${ext}`;

  const { error: upError } = await supabase.storage.from(bucket).upload(storagePath, buf, {
    contentType: mime,
    upsert: true,
  });
  if (upError) return;

  const { data: row, error: insertError } = await supabase
    .from("files")
    .insert({
      user_id: user.id,
      bucket,
      storage_path: storagePath,
      mime_type: mime,
      byte_size: buf.length,
      purpose: "profile_avatar",
      linked_entity_type: null,
      linked_entity_id: null,
    })
    .select("id")
    .single();

  if (insertError || !row) {
    await supabase.storage.from(bucket).remove([storagePath]);
    return;
  }

  await supabase.from("profiles").update({ avatar_file_id: row.id }).eq("id", user.id);
}
