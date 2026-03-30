import { NextResponse } from "next/server";

const allowed = new Set(["owner", "provider"]);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const role = typeof body === "object" && body && "role" in body ? (body as { role: unknown }).role : null;
  if (typeof role !== "string" || !allowed.has(role)) {
    return NextResponse.json({ error: "role deve ser owner ou provider" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("linkora_pending_role", role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  return res;
}
