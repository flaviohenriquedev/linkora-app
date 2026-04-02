import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";

type ContactType = "email" | "phone" | "whatsapp";

function isContactType(v: unknown): v is ContactType {
  return v === "email" || v === "phone" || v === "whatsapp";
}

export async function GET() {
  const supabase = await tryCreateClient();
  if (!supabase) return NextResponse.json({ error: "Supabase indisponível" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data, error } = await supabase
    .from("provider_contacts")
    .select("id, type, label, value, is_public, sort_order, created_at")
    .eq("provider_id", user.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contacts: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await tryCreateClient();
  if (!supabase) return NextResponse.json({ error: "Supabase indisponível" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const type = body.type;
  const value = typeof body.value === "string" ? body.value.trim() : "";
  const label = typeof body.label === "string" ? body.label.trim() : null;
  const isPublic = body.is_public !== false;
  const sortOrder = Number.isFinite(body.sort_order) ? Number(body.sort_order) : 0;

  if (!isContactType(type)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }
  if (!value) {
    return NextResponse.json({ error: "Contato obrigatório" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("provider_contacts")
    .insert({
      provider_id: user.id,
      type,
      label: label || null,
      value,
      is_public: isPublic,
      sort_order: sortOrder,
    })
    .select("id, type, label, value, is_public, sort_order, created_at")
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: error?.message ?? "Falha ao salvar" }, { status: 500 });
  return NextResponse.json({ contact: data });
}
