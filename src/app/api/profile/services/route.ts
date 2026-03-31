import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function ensureActiveCategory(supabase: SupabaseClient, categoryId: string) {
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return false;
  return true;
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

  const { data: rows, error } = await supabase
    .from("provider_services")
    .select("id, user_id, category_id, title, description, price_cents, sort_order, is_active, created_at, updated_at")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = rows ?? [];
  const catIds = [...new Set(list.map((r: (typeof list)[number]) => r.category_id))];
  let cats: { id: string; name: string; slug: string }[] = [];
  if (catIds.length > 0) {
    const { data: catRows } = await supabase.from("categories").select("id, name, slug").in("id", catIds);
    cats = catRows ?? [];
  }
  const catMap = new Map(cats.map((c) => [c.id, c]));

  const services = list.map((r: (typeof list)[number]) => ({
    ...r,
    category: catMap.get(r.category_id) ?? null,
  }));

  return NextResponse.json({ services });
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const categoryId = typeof body.category_id === "string" ? body.category_id.trim() : "";
  const title =
    typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Novo serviço";
  const description =
    typeof body.description === "string" ? body.description.trim() || null : null;
  const sortOrder = typeof body.sort_order === "number" && Number.isFinite(body.sort_order) ? body.sort_order : 0;

  let priceCents: number | null = null;
  if (body.price_cents === null) {
    priceCents = null;
  } else if (typeof body.price_cents === "number" && Number.isFinite(body.price_cents) && body.price_cents >= 0) {
    priceCents = Math.round(body.price_cents);
  }

  if (!categoryId) {
    return NextResponse.json({ error: "category_id é obrigatório" }, { status: 400 });
  }

  const ok = await ensureActiveCategory(supabase, categoryId);
  if (!ok) {
    return NextResponse.json({ error: "Categoria inválida ou inativa" }, { status: 400 });
  }

  const { data: row, error } = await supabase
    .from("provider_services")
    .insert({
      user_id: user.id,
      category_id: categoryId,
      title,
      description,
      price_cents: priceCents,
      sort_order: sortOrder,
      is_active: true,
    })
    .select("id, user_id, category_id, title, description, price_cents, sort_order, is_active, created_at, updated_at")
    .single();

  if (error || !row) {
    return NextResponse.json({ error: error?.message ?? "Falha ao criar serviço" }, { status: 500 });
  }

  const { data: cat } = await supabase.from("categories").select("id, name, slug").eq("id", row.category_id).maybeSingle();

  return NextResponse.json({ service: { ...row, category: cat ?? null } });
}
