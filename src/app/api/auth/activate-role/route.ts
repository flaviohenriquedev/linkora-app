import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabasePublicEnv } from "@/lib/env";
import { tryCreateClient } from "@/lib/supabase/server";

const allowed = new Set(["owner", "provider"]);

function homePath(role: "owner" | "provider") {
  return role === "provider" ? "/profile" : "/owner";
}

export async function POST(request: Request) {
  const env = getSupabasePublicEnv();
  if (!env) {
    return NextResponse.json({ error: "Supabase indisponível" }, { status: 503 });
  }

  let body: { role?: unknown };
  try {
    body = (await request.json()) as { role?: unknown };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
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

  const role = body.role;
  if (typeof role !== "string" || !allowed.has(role)) {
    return NextResponse.json({ error: "role deve ser owner ou provider" }, { status: 400 });
  }

  const typedRole = role as "owner" | "provider";

  if (typedRole === "owner") {
    const { data: ownerRow, error: ownerErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .maybeSingle();
    if (ownerErr) {
      return NextResponse.json({ error: ownerErr.message }, { status: 500 });
    }
    if (!ownerRow) {
      return NextResponse.json(
        {
          error: "Você não possui uma conta de Empresário cadastrada.",
          code: "NO_OWNER_ACCOUNT",
        },
        { status: 403 },
      );
    }
  }

  const { error: roleErr } = await supabase
    .from("user_roles")
    .upsert({ user_id: user.id, role: typedRole }, { onConflict: "user_id,role" });
  if (roleErr) {
    return NextResponse.json({ error: roleErr.message }, { status: 500 });
  }

  const { error: profileErr } = await supabase
    .from("profiles")
    .upsert({ id: user.id, role: typedRole }, { onConflict: "id" });
  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true, role: typedRole, redirectTo: homePath(typedRole) });
  res.cookies.set("linkora_active_role", typedRole, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
