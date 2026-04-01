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
    .select(
      "id, title, slug, description, image_file_id, attachment_file_id, external_link, is_published, sort_order, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

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
    image_file_id?: string | null;
    attachment_file_id?: string | null;
    external_link?: string | null;
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
      image_file_id:
        body.image_file_id === null
          ? null
          : typeof body.image_file_id === "string" && body.image_file_id.trim()
            ? body.image_file_id.trim()
            : null,
      attachment_file_id:
        body.attachment_file_id === null
          ? null
          : typeof body.attachment_file_id === "string" && body.attachment_file_id.trim()
            ? body.attachment_file_id.trim()
            : null,
      external_link:
        body.external_link === null
          ? null
          : typeof body.external_link === "string" && body.external_link.trim()
            ? body.external_link.trim()
            : null,
    })
    .select(
      "id, title, slug, description, image_file_id, attachment_file_id, external_link, is_published, sort_order, created_at, updated_at",
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ course: data });
}
