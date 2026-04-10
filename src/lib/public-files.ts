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

    let portfolioOk = false;
    if (!art && !crs && !matRow) {
      const { data: pp } = await admin
        .from("provider_portfolio_posts")
        .select("provider_id")
        .eq("image_file_id", fileId)
        .eq("is_public", true)
        .maybeSingle();
      if (pp?.provider_id) {
        const { data: pr } = await admin
          .from("profiles")
          .select("is_active, role")
          .eq("id", pp.provider_id as string)
          .maybeSingle();
        portfolioOk = Boolean(pr?.role === "provider" && pr?.is_active === true);
      }
    }

    if (!art && !crs && !matRow && !portfolioOk) return null;

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

/**
 * URL assinada do avatar de um prestador ativo (listagens públicas).
 * Exige service role: RLS não expõe `files` de avatar para anônimos.
 */
export async function getSignedUrlForPublicProviderAvatar(
  fileId: string | null | undefined,
  expiresSec = 3600,
): Promise<string | null> {
  if (!fileId?.trim()) return null;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return null;
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("avatar_file_id", fileId)
    .eq("role", "provider")
    .eq("is_active", true)
    .maybeSingle();

  if (!profile) return null;

  const { data: fileRow, error: fileErr } = await admin
    .from("files")
    .select("bucket, storage_path")
    .eq("id", fileId)
    .maybeSingle();

  if (fileErr || !fileRow?.storage_path) return null;

  const bucket = (fileRow.bucket as string) || "linkora-files";
  const { data: signed, error: signErr } = await admin.storage
    .from(bucket)
    .createSignedUrl(fileRow.storage_path as string, expiresSec);

  if (signErr || !signed?.signedUrl) return null;
  return signed.signedUrl;
}
