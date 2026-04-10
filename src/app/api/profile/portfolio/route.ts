import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parsePortfolioCropAspect } from "@/lib/portfolio-crop-aspect";
import { createClient } from "@/lib/supabase/server";

const MAX_CAPTION = 2000;
const MAX_POSTS = 60;

async function requireProvider(supabase: SupabaseClient, userId: string) {
  const { data: prof, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();
  if (error || !prof || prof.role !== "provider") {
    return { ok: false as const, response: NextResponse.json({ error: "Apenas prestadores" }, { status: 403 }) };
  }
  return { ok: true as const, supabase };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const gate = await requireProvider(supabase, user.id);
  if (!gate.ok) return gate.response;

  const { data: rows, error } = await supabase
    .from("provider_portfolio_posts")
    .select("id, caption, sort_order, is_public, created_at, image_file_id, crop_aspect")
    .eq("provider_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = rows ?? [];
  const fileIds = [...new Set(list.map((r) => r.image_file_id as string))];
  const fileMap = new Map<string, { bucket: string; storage_path: string }>();

  if (fileIds.length > 0) {
    const { data: filesRows } = await supabase
      .from("files")
      .select("id, bucket, storage_path")
      .in("id", fileIds);
    for (const f of filesRows ?? []) {
      fileMap.set(f.id as string, {
        bucket: (f.bucket as string) || "linkora-files",
        storage_path: f.storage_path as string,
      });
    }
  }

  const posts = await Promise.all(
    list.map(async (r) => {
      const fr = fileMap.get(r.image_file_id as string);
      let imageUrl: string | null = null;
      if (fr?.storage_path) {
        const { data: signed } = await supabase.storage.from(fr.bucket).createSignedUrl(fr.storage_path, 3600);
        imageUrl = signed?.signedUrl ?? null;
      }
      return {
        id: r.id as string,
        caption: r.caption as string | null,
        sort_order: r.sort_order as number,
        is_public: r.is_public as boolean,
        created_at: r.created_at as string,
        image_file_id: r.image_file_id as string,
        crop_aspect: parsePortfolioCropAspect((r as { crop_aspect?: string }).crop_aspect),
        imageUrl,
      };
    }),
  );

  return NextResponse.json({ posts });
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
  const gate = await requireProvider(supabase, user.id);
  if (!gate.ok) return gate.response;

  const { count } = await supabase
    .from("provider_portfolio_posts")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", user.id);
  if ((count ?? 0) >= MAX_POSTS) {
    return NextResponse.json({ error: `Limite de ${MAX_POSTS} fotos no portfólio.` }, { status: 400 });
  }

  let body: {
    image_file_id?: string;
    caption?: string | null;
    is_public?: boolean;
    crop_aspect?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const imageFileId = typeof body.image_file_id === "string" ? body.image_file_id.trim() : "";
  if (!imageFileId) {
    return NextResponse.json({ error: "image_file_id obrigatório" }, { status: 400 });
  }

  const { data: fileRow, error: fileErr } = await supabase
    .from("files")
    .select("id, purpose, user_id")
    .eq("id", imageFileId)
    .maybeSingle();

  if (fileErr || !fileRow || fileRow.user_id !== user.id || fileRow.purpose !== "provider_portfolio") {
    return NextResponse.json({ error: "Arquivo inválido ou não autorizado" }, { status: 400 });
  }

  const { data: used } = await supabase
    .from("provider_portfolio_posts")
    .select("id")
    .eq("image_file_id", imageFileId)
    .maybeSingle();
  if (used) {
    return NextResponse.json({ error: "Esta imagem já está no portfólio" }, { status: 400 });
  }

  let caption: string | null =
    typeof body.caption === "string" ? body.caption.trim().slice(0, MAX_CAPTION) : null;
  if (caption === "") caption = null;

  const isPublic = typeof body.is_public === "boolean" ? body.is_public : true;
  const crop_aspect = parsePortfolioCropAspect(body.crop_aspect);

  const { data: inserted, error: insErr } = await supabase
    .from("provider_portfolio_posts")
    .insert({
      provider_id: user.id,
      image_file_id: imageFileId,
      caption,
      is_public: isPublic,
      sort_order: 0,
      crop_aspect,
    })
    .select("id, caption, sort_order, is_public, created_at, image_file_id, crop_aspect")
    .single();

  if (insErr || !inserted) {
    return NextResponse.json({ error: insErr?.message ?? "Falha ao criar post" }, { status: 500 });
  }

  const { data: f } = await supabase
    .from("files")
    .select("bucket, storage_path")
    .eq("id", imageFileId)
    .maybeSingle();
  let imageUrl: string | null = null;
  if (f?.storage_path) {
    const { data: signed } = await supabase.storage
      .from((f.bucket as string) || "linkora-files")
      .createSignedUrl(f.storage_path as string, 3600);
    imageUrl = signed?.signedUrl ?? null;
  }

  return NextResponse.json({
    post: {
      ...inserted,
      crop_aspect: parsePortfolioCropAspect((inserted as { crop_aspect?: string }).crop_aspect),
      imageUrl,
    },
  });
}
