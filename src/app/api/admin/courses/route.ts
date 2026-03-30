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
    .from("courses")
    .select("id, title, slug, description, is_published, sort_order, created_at, updated_at")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ courses: data });
}

export async function POST(request: Request) {
  const { isAdmin } = await isCurrentUserAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

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

  const title = (body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });

  const supabase = await createClient();
  const slug = slugify(title);
  const { data, error } = await supabase
    .from("courses")
    .insert({
      title,
      slug,
      description: body.description?.trim() || null,
      is_published: body.is_published ?? false,
      sort_order: Number.isFinite(body.sort_order) ? Math.floor(body.sort_order!) : 0,
    })
    .select("id, title, slug, description, is_published, sort_order, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ course: data });
}
