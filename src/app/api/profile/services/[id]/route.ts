import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function ensureActiveCategory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  categoryId: string,
) {
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return false;
  return true;
}

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const patch: Record<string, string | number | boolean | null> = {};

  if (typeof body.title === "string") patch.title = body.title.trim() || "Serviço";
  if (body.description === null || typeof body.description === "string") {
    patch.description = body.description === null || body.description === "" ? null : String(body.description);
  }
  if (typeof body.sort_order === "number" && Number.isFinite(body.sort_order)) patch.sort_order = body.sort_order;
  if (typeof body.is_active === "boolean") patch.is_active = body.is_active;

  if (typeof body.category_id === "string" && body.category_id.trim()) {
    const cid = body.category_id.trim();
    const ok = await ensureActiveCategory(supabase, cid);
    if (!ok) {
      return NextResponse.json({ error: "Categoria inválida ou inativa" }, { status: 400 });
    }
    patch.category_id = cid;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nenhum campo válido" }, { status: 400 });
  }

  const { data: row, error } = await supabase
    .from("provider_services")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, user_id, category_id, title, description, sort_order, is_active, created_at, updated_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
  }

  const { data: cat } = await supabase.from("categories").select("id, name, slug").eq("id", row.category_id).maybeSingle();

  return NextResponse.json({ service: { ...row, category: cat ?? null } });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const { error } = await supabase.from("provider_services").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
