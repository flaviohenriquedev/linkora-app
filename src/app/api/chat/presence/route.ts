import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";

type PresenceStatus = "online" | "away" | "offline";

export async function POST(request: Request) {
  const supabase = await tryCreateClient();
  if (!supabase) return NextResponse.json({ error: "Supabase indisponível" }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let status: PresenceStatus = "online";
  try {
    const body = (await request.json()) as { status?: unknown };
    const candidate = body?.status;
    if (candidate === "online" || candidate === "away" || candidate === "offline") status = candidate;
  } catch {
    // body ausente/ inválido => default "online"
  }

  const { error } = await supabase.from("chat_presence").upsert(
    {
      user_id: user.id,
      status,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
