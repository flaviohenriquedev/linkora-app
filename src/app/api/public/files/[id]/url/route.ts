import { NextResponse } from "next/server";
import { getSignedUrlForPublicFile } from "@/lib/public-files";

type Ctx = { params: Promise<{ id: string }> };

/** JSON com URL assinada (cliente, iframe, <a> sem depender de redirect). */
export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const url = await getSignedUrlForPublicFile(id);
  if (!url) {
    return NextResponse.json({ error: "Não encontrado ou não autorizado" }, { status: 404 });
  }

  return NextResponse.json({ url });
}
