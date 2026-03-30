import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseSessionUser } from "@/lib/supabase/middleware";

const protectedPrefixes = ["/profile", "/user-profile", "/owner", "/admin"];

export async function middleware(request: NextRequest) {
  try {
    const { response, user } = await getSupabaseSessionUser(request);
    const { pathname } = request.nextUrl;

    const needsAuth = protectedPrefixes.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );

    if (!needsAuth || user) return response;

    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  } catch (e) {
    console.error("[middleware]", e);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
