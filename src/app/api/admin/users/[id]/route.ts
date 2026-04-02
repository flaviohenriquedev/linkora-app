import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { isAdmin } = await isCurrentUserAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  let body: { is_active?: unknown };
  try {
    body = (await request.json()) as { is_active?: unknown };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (typeof body.is_active !== "boolean") {
    return NextResponse.json({ error: "is_active deve ser boolean" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").update({ is_active: body.is_active }).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id, is_active: body.is_active });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro no servidor";
    if (msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json({ error: "Servidor sem permissão de admin (service role)" }, { status: 503 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
