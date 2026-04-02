import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ threadId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const supabase = await tryCreateClient();
  if (!supabase) return NextResponse.json({ error: "Supabase indisponível" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { threadId } = await context.params;
  if (!threadId?.trim()) return NextResponse.json({ error: "threadId inválido" }, { status: 400 });

  const { data: row, error: selErr } = await supabase
    .from("chat_threads")
    .select("id, owner_id, provider_id")
    .eq("id", threadId)
    .maybeSingle();

  if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });

  if (row.owner_id !== row.provider_id || row.owner_id !== user.id) {
    return NextResponse.json(
      { error: "Só é possível apagar a conversa Notas para mim." },
      { status: 403 },
    );
  }

  const { error: delErr } = await supabase.from("chat_threads").delete().eq("id", threadId);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
