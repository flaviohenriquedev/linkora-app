import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function PATCH(request: Request, { params }: Params) {
  const { isAdmin } = await isCurrentUserAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  let body: {
    title?: string;
    excerpt?: string;
    body?: string;
    is_published?: boolean;
    image_file_id?: string | null;
    attachment_file_id?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: existing, error: fetchErr } = await supabase
    .from("blog_posts")
    .select("id, published_at, is_published")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: fetchErr?.message ?? "Post não encontrado" }, { status: 404 });
  }

  const patch: Record<string, string | boolean | null> = {};
  if (typeof body.title === "string" && body.title.trim()) {
    patch.title = body.title.trim();
    patch.slug = slugify(body.title);
  }
  if (typeof body.excerpt === "string") patch.excerpt = body.excerpt || null;
  if (typeof body.body === "string") patch.body = body.body || null;
  if (body.image_file_id === null) {
    patch.image_file_id = null;
  } else if (typeof body.image_file_id === "string" && body.image_file_id.trim()) {
    patch.image_file_id = body.image_file_id.trim();
  }
  if (body.attachment_file_id === null) {
    patch.attachment_file_id = null;
  } else if (typeof body.attachment_file_id === "string" && body.attachment_file_id.trim()) {
    patch.attachment_file_id = body.attachment_file_id.trim();
  }
  if (typeof body.is_published === "boolean") {
    patch.is_published = body.is_published;
    if (body.is_published && !existing.published_at) {
      patch.published_at = new Date().toISOString();
    }
    if (!body.is_published) {
      patch.published_at = null;
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nenhum campo válido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .update(patch)
    .eq("id", id)
    .select(
      "id, title, slug, excerpt, body, image_file_id, attachment_file_id, is_published, published_at, created_at, updated_at",
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}

export async function DELETE(_: Request, { params }: Params) {
  const { isAdmin } = await isCurrentUserAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
