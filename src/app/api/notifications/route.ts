import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await tryCreateClient();
  if (!supabase) return NextResponse.json({ error: "Supabase indisponível" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data: rows, error } = await supabase
    .from("in_app_notifications")
    .select("id, type, title, body, link, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = rows ?? [];
  const unreadCount = items.filter((n) => !n.read_at).length;

  return NextResponse.json({ items, unreadCount });
}

export async function PATCH(request: Request) {
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

  if (body.markAllRead === true) {
    const { error } = await supabase
      .from("in_app_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string") : [];
  if (!ids.length) return NextResponse.json({ error: "ids ou markAllRead obrigatório" }, { status: 400 });

  const { error } = await supabase
    .from("in_app_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .in("id", ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
