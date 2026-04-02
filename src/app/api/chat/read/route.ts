import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await tryCreateClient();
  if (!supabase) return NextResponse.json({ error: "Supabase indisponível" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let body: { threadId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const threadId = typeof body.threadId === "string" ? body.threadId : "";
  if (!threadId) return NextResponse.json({ error: "threadId obrigatório" }, { status: 400 });

  const { error } = await supabase.rpc("chat_mark_messages_read", { p_thread: threadId });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
