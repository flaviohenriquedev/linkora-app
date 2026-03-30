import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { syncOAuthAvatarIfMissing } from "@/lib/auth/syncOAuthAvatar";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextRaw = url.searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth_cancelado", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  const cookieStore = await cookies();
  const pending = cookieStore.get("linkora_pending_role")?.value;
  const nextCookie = cookieStore.get("linkora_next")?.value;

  const nextFromCookie = nextCookie ? decodeURIComponent(nextCookie) : nextRaw;
  const next = nextFromCookie.startsWith("/") ? nextFromCookie : "/";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && (pending === "owner" || pending === "provider")) {
    await supabase
      .from("user_roles")
      .upsert({ user_id: user.id, role: pending }, { onConflict: "user_id,role" });
    await supabase
      .from("profiles")
      .upsert({ id: user.id, role: pending }, { onConflict: "id" });
  }

  if (user) {
    await syncOAuthAvatarIfMissing(supabase, user);
  }

  const res = NextResponse.redirect(new URL(next, url.origin));
  res.cookies.set("linkora_pending_role", "", { maxAge: 0, path: "/" });
  res.cookies.set("linkora_next", "", { maxAge: 0, path: "/" });
  if (pending === "owner" || pending === "provider") {
    res.cookies.set("linkora_active_role", pending, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }
  return res;
}
