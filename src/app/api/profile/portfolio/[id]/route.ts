import { NextResponse } from "next/server";
import { parsePortfolioCropAspect } from "@/lib/portfolio-crop-aspect";
import { createClient } from "@/lib/supabase/server";

const MAX_CAPTION = 2000;

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (prof?.role !== "provider") {
    return NextResponse.json({ error: "Apenas prestadores" }, { status: 403 });
  }

  let body: { caption?: string | null; is_public?: boolean; crop_aspect?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (body.caption === null) {
    patch.caption = null;
  } else if (typeof body.caption === "string") {
    const t = body.caption.trim().slice(0, MAX_CAPTION);
    patch.caption = t.length ? t : null;
  }
  if (typeof body.is_public === "boolean") patch.is_public = body.is_public;
  if (body.crop_aspect !== undefined) {
    patch.crop_aspect = parsePortfolioCropAspect(body.crop_aspect);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nenhum campo" }, { status: 400 });
  }

  const { data: row, error } = await supabase
    .from("provider_portfolio_posts")
    .update(patch)
    .eq("id", id)
    .eq("provider_id", user.id)
    .select("id, caption, sort_order, is_public, created_at, image_file_id, crop_aspect")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ post: row });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (prof?.role !== "provider") {
    return NextResponse.json({ error: "Apenas prestadores" }, { status: 403 });
  }

  const { data: post, error: fetchErr } = await supabase
    .from("provider_portfolio_posts")
    .select("id, image_file_id")
    .eq("id", id)
    .eq("provider_id", user.id)
    .maybeSingle();

  if (fetchErr || !post) {
    return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
  }

  const fileId = post.image_file_id as string;

  const { error: delPostErr } = await supabase
    .from("provider_portfolio_posts")
    .delete()
    .eq("id", id)
    .eq("provider_id", user.id);

  if (delPostErr) {
    return NextResponse.json({ error: delPostErr.message }, { status: 500 });
  }

  const { data: fileRow } = await supabase
    .from("files")
    .select("bucket, storage_path")
    .eq("id", fileId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fileRow?.storage_path) {
    const bucket = (fileRow.bucket as string) || "linkora-files";
    await supabase.storage.from(bucket).remove([fileRow.storage_path as string]);
  }

  await supabase.from("files").delete().eq("id", fileId).eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
