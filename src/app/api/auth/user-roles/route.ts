import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabasePublicEnv } from "@/lib/env";
import { tryCreateClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const env = getSupabasePublicEnv();
  if (!env) {
    return NextResponse.json({ error: "Supabase indisponível" }, { status: 503 });
  }

  let supabase = await tryCreateClient();
  let user = (await supabase?.auth.getUser())?.data.user ?? null;

  if (!user) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const client = createSupabaseJsClient(env.url, env.anon, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await client.auth.getUser();
      user = data.user ?? null;
      if (user) {
        supabase = client;
      }
    }
  }

  if (!user || !supabase) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const roles = (data ?? [])
    .map((r: { role: string }) => r.role)
    .filter((r: string): r is "owner" | "provider" => r === "owner" || r === "provider");

  return NextResponse.json({ roles });
}
