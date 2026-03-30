import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, is_active, created_at, updated_at")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ categories: data });
}

export async function POST(request: Request) {
  const { isAdmin } = await isCurrentUserAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  let body: { name?: string; description?: string; is_active?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const supabase = await createClient();
  const slug = slugify(name);
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name,
      slug,
      description: body.description?.trim() || null,
      is_active: body.is_active ?? true,
    })
    .select("id, name, slug, description, is_active, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}
