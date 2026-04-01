import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materials")
    .select("id, title, attachment_file_id, sort_order, is_published, created_at, updated_at")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ materials: data ?? [] });
}

export async function POST(request: Request) {
  const { isAdmin } = await isCurrentUserAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  let body: {
    title?: string;
    is_published?: boolean;
    sort_order?: number;
    attachment_file_id?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materials")
    .insert({
      title,
      is_published: body.is_published ?? false,
      sort_order: Number.isFinite(body.sort_order) ? Math.floor(body.sort_order!) : 0,
      attachment_file_id:
        body.attachment_file_id === null
          ? null
          : typeof body.attachment_file_id === "string" && body.attachment_file_id.trim()
            ? body.attachment_file_id.trim()
            : null,
    })
    .select("id, title, attachment_file_id, sort_order, is_published, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ material: data });
}
