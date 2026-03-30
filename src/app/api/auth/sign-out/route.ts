import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("linkora_active_role", "", { maxAge: 0, path: "/" });
  res.cookies.set("linkora_pending_role", "", { maxAge: 0, path: "/" });
  res.cookies.set("linkora_next", "", { maxAge: 0, path: "/" });
  return res;
}
