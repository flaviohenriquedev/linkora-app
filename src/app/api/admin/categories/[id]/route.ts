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
  let body: { name?: string; description?: string; is_active?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const patch: Record<string, string | boolean | null> = {};
  if (typeof body.name === "string" && body.name.trim()) {
    patch.name = body.name.trim();
    patch.slug = slugify(body.name);
  }
  if (typeof body.description === "string") patch.description = body.description || null;
  if (typeof body.is_active === "boolean") patch.is_active = body.is_active;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nenhum campo válido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .update(patch)
    .eq("id", id)
    .select("id, name, slug, description, is_active, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}

export async function DELETE(_: Request, { params }: Params) {
  const { isAdmin } = await isCurrentUserAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
