import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";

type ContactType = "email" | "phone" | "whatsapp";

function isContactType(v: unknown): v is ContactType {
  return v === "email" || v === "phone" || v === "whatsapp";
}

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const supabase = await tryCreateClient();
  if (!supabase) return NextResponse.json({ error: "Supabase indisponível" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (isContactType(body.type)) patch.type = body.type;
  if (typeof body.value === "string") patch.value = body.value.trim();
  if (typeof body.label === "string") patch.label = body.label.trim() || null;
  if (typeof body.is_public === "boolean") patch.is_public = body.is_public;
  if (Number.isFinite(body.sort_order)) patch.sort_order = Number(body.sort_order);

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nenhum campo válido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("provider_contacts")
    .update(patch)
    .eq("id", id)
    .eq("provider_id", user.id)
    .select("id, type, label, value, is_public, sort_order, created_at")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Contato não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ contact: data });
}

export async function DELETE(_: Request, { params }: Params) {
  const supabase = await tryCreateClient();
  if (!supabase) return NextResponse.json({ error: "Supabase indisponível" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const { error } = await supabase
    .from("provider_contacts")
    .delete()
    .eq("id", id)
    .eq("provider_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
