import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowed = new Set(["owner", "provider"]);

function homePath(role: "owner" | "provider") {
  return role === "provider" ? "/profile" : "/owner";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let role: unknown;
  try {
    const body = (await request.json()) as { role?: unknown };
    role = body.role;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (typeof role !== "string" || !allowed.has(role)) {
    return NextResponse.json({ error: "role deve ser owner ou provider" }, { status: 400 });
  }

  const typedRole = role as "owner" | "provider";

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
