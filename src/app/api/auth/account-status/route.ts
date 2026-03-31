import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  let email: string;
  try {
    const body = await request.json();
    email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const user = data.users.find((u) => u.email?.toLowerCase() === email);
    if (!user) {
      return NextResponse.json({ exists: false, oauthOnly: false, roles: [] });
    }

    const hasEmailIdentity = user.identities?.some((i) => i.provider === "email") ?? false;

    const { data: roleRows, error: rolesErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesErr) {
      return NextResponse.json({ error: rolesErr.message }, { status: 500 });
    }

    const roles = (roleRows ?? [])
      .map((r) => r.role)
      .filter((r): r is "owner" | "provider" => r === "owner" || r === "provider");

    return NextResponse.json({
      exists: true,
      oauthOnly: !hasEmailIdentity,
      roles,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro no servidor";
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json(
        { error: "Servidor sem SUPABASE_SERVICE_ROLE_KEY (necessário para esta verificação)" },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
