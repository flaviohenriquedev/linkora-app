import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";

const MAX_IDS = 80;

export type ProviderPresence = "online" | "away" | "offline";

function resolvePresence(
  row: { status: string; last_seen_at: string } | undefined,
  now: number,
): ProviderPresence {
  if (!row) return "offline";
  const lastSeen = new Date(row.last_seen_at).getTime();
  const age = now - lastSeen;
  const fresh2m = age <= 2 * 60 * 1000;
  const fresh12m = age <= 12 * 60 * 1000;
  if (row.status === "online" && fresh2m) return "online";
  if (row.status === "away" && fresh12m) return "away";
  if (row.status === "online" && fresh12m) return "away";
  return "offline";
}

/** Presença de prestadores (lista pública) para utilizadores autenticados. */
export async function GET(request: Request) {
  const supabase = await tryCreateClient();
  if (!supabase) return NextResponse.json({ error: "Supabase indisponível" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("ids");
  if (!raw?.trim()) return NextResponse.json({ presence: {} as Record<string, ProviderPresence> });

  const ids = [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, MAX_IDS);
  if (!ids.length) return NextResponse.json({ presence: {} as Record<string, ProviderPresence> });

  const { data: rows, error } = await supabase
    .from("chat_presence")
    .select("user_id, status, last_seen_at")
    .in("user_id", ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = Date.now();
  const presence: Record<string, ProviderPresence> = {};
  for (const id of ids) {
    presence[id] = "offline";
  }
  for (const r of rows ?? []) {
    presence[r.user_id] = resolvePresence(r, now);
  }

  return NextResponse.json({ presence });
}
