import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

/** URL assinada para preview no painel (admin). */
export async function GET(_request: Request, ctx: Ctx) {
  const { isAdmin } = await isCurrentUserAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const supabase = await createClient();
  const { data: fileRow, error } = await supabase
    .from("files")
    .select("bucket, storage_path")
    .eq("id", id)
    .maybeSingle();

  if (error || !fileRow) {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from(fileRow.bucket as string)
    .createSignedUrl(fileRow.storage_path as string, 3600);

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: "Não foi possível gerar o link" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
