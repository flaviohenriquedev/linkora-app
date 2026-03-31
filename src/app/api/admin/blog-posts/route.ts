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
    .from("blog_posts")
    .select(
      "id, title, slug, excerpt, body, image_file_id, attachment_file_id, is_published, published_at, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ posts: data });
}

export async function POST(request: Request) {
  const { isAdmin } = await isCurrentUserAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

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

  const title = (body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });

  const isPublished = body.is_published ?? false;
  const publishedAt = isPublished ? new Date().toISOString() : null;

  const supabase = await createClient();
  const slug = slugify(title);
  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      title,
      slug,
      excerpt: body.excerpt?.trim() || null,
      body: body.body?.trim() || null,
      is_published: isPublished,
      published_at: publishedAt,
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
    })
    .select(
      "id, title, slug, excerpt, body, image_file_id, attachment_file_id, is_published, published_at, created_at, updated_at",
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}
