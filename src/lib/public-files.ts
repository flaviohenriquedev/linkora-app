import { createAdminClient } from "@/lib/supabase/admin";
import { tryCreateClient } from "@/lib/supabase/server";

/**
 * Valida se o arquivo está ligado a conteúdo publicado e devolve URL assinada do Storage.
 * Com service role: validação explícita. Sem service role: fallback via cliente servidor + RLS
 * (`files_select_published_content` + storage), como no avatar do perfil.
 */
export async function getSignedUrlForPublicFile(
  fileId: string,
  expiresSec = 3600,
): Promise<string | null> {
  if (!fileId?.trim()) return null;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    admin = null;
  }

  if (admin) {
    const { data: fileRow, error: fileErr } = await admin
      .from("files")
      .select("id, bucket, storage_path")
      .eq("id", fileId)
      .maybeSingle();

    if (fileErr || !fileRow) return null;

    const [imgArt, attArt, imgCrs, attCrs, mat] = await Promise.all([
      admin.from("blog_posts").select("id").eq("is_published", true).eq("image_file_id", fileId).limit(1).maybeSingle(),
      admin.from("blog_posts").select("id").eq("is_published", true).eq("attachment_file_id", fileId).limit(1).maybeSingle(),
      admin.from("courses").select("id").eq("is_published", true).eq("image_file_id", fileId).limit(1).maybeSingle(),
      admin.from("courses").select("id").eq("is_published", true).eq("attachment_file_id", fileId).limit(1).maybeSingle(),
      admin.from("materials").select("id").eq("is_published", true).eq("attachment_file_id", fileId).limit(1).maybeSingle(),
    ]);

    const art = imgArt.data ?? attArt.data;
    const crs = imgCrs.data ?? attCrs.data;
    const matRow = mat.data;

    if (!art && !crs && !matRow) return null;

    const { data: signed, error: signErr } = await admin.storage
      .from(fileRow.bucket as string)
      .createSignedUrl(fileRow.storage_path as string, expiresSec);

    if (signErr || !signed?.signedUrl) return null;
    return signed.signedUrl;
  }

  const supabase = await tryCreateClient();
  if (!supabase) return null;

  const { data: fileRow, error: fileErr } = await supabase
    .from("files")
    .select("bucket, storage_path")
    .eq("id", fileId)
    .maybeSingle();

  if (fileErr || !fileRow) return null;

  const { data: signed, error: signErr } = await supabase.storage
    .from(fileRow.bucket as string)
    .createSignedUrl(fileRow.storage_path as string, expiresSec);

  if (signErr || !signed?.signedUrl) return null;
  return signed.signedUrl;
}
