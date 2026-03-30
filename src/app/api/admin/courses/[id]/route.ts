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
    description?: string;
    is_published?: boolean;
    sort_order?: number;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const patch: Record<string, string | boolean | number | null> = {};
  if (typeof body.title === "string" && body.title.trim()) {
    patch.title = body.title.trim();
    patch.slug = slugify(body.title);
  }
  if (typeof body.description === "string") patch.description = body.description || null;
  if (typeof body.is_published === "boolean") patch.is_published = body.is_published;
  if (body.sort_order !== undefined && Number.isFinite(body.sort_order)) {
    patch.sort_order = Math.floor(body.sort_order);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nenhum campo válido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .update(patch)
    .eq("id", id)
    .select("id, title, slug, description, is_published, sort_order, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ course: data });
}

export async function DELETE(_: Request, { params }: Params) {
  const { isAdmin } = await isCurrentUserAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
