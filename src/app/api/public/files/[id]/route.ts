import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

/** Redireciona para URL assinada do Storage se o arquivo está ligado a conteúdo publicado. */
export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Serviço indisponível" }, { status: 503 });
  }

  const { data: fileRow, error: fileErr } = await admin
    .from("files")
    .select("id, bucket, storage_path")
    .eq("id", id)
    .maybeSingle();

  if (fileErr || !fileRow) {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }

  const [imgArt, attArt, imgCrs, attCrs, mat] = await Promise.all([
    admin.from("blog_posts").select("id").eq("is_published", true).eq("image_file_id", id).limit(1).maybeSingle(),
    admin.from("blog_posts").select("id").eq("is_published", true).eq("attachment_file_id", id).limit(1).maybeSingle(),
    admin.from("courses").select("id").eq("is_published", true).eq("image_file_id", id).limit(1).maybeSingle(),
    admin.from("courses").select("id").eq("is_published", true).eq("attachment_file_id", id).limit(1).maybeSingle(),
    admin.from("materials").select("id").eq("is_published", true).eq("attachment_file_id", id).limit(1).maybeSingle(),
  ]);

  const art = imgArt.data ?? attArt.data;
  const crs = imgCrs.data ?? attCrs.data;

  if (!art && !crs && !mat?.data) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { data: signed, error: signErr } = await admin.storage
    .from(fileRow.bucket as string)
    .createSignedUrl(fileRow.storage_path as string, 3600);

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: "Não foi possível gerar o link" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
