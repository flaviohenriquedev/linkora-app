import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { isAdmin } = await isCurrentUserAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
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

  const patch: Record<string, string | boolean | number | null> = {};
  if (typeof body.title === "string" && body.title.trim()) patch.title = body.title.trim();
  if (typeof body.is_published === "boolean") patch.is_published = body.is_published;
  if (body.sort_order !== undefined && Number.isFinite(body.sort_order)) {
    patch.sort_order = Math.floor(body.sort_order);
  }
  if (body.attachment_file_id === null) {
    patch.attachment_file_id = null;
  } else if (typeof body.attachment_file_id === "string" && body.attachment_file_id.trim()) {
    patch.attachment_file_id = body.attachment_file_id.trim();
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nenhum campo válido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materials")
    .update(patch)
    .eq("id", id)
    .select("id, title, attachment_file_id, sort_order, is_published, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ material: data });
}

export async function DELETE(_: Request, { params }: Params) {
  const { isAdmin } = await isCurrentUserAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
