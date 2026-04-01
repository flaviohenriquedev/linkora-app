import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {syncOAuthAvatarIfMissing} from "@/lib/auth/syncOAuthAvatar";
import {createClient} from "@/lib/supabase/server";

function isGoogleIdentity(user: { identities?: { provider?: string }[] } | null): boolean {
    return Boolean(user?.identities?.some((i) => i.provider === "google"));
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const nextRaw = url.searchParams.get("next") ?? "/";

    if (!code) {
        return NextResponse.redirect(new URL("/login?error=oauth_cancelado", url.origin));
    }

    const supabase = await createClient();
    const {error} = await supabase.auth.exchangeCodeForSession(code);

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
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        const res = NextResponse.redirect(new URL(next, url.origin));
        res.cookies.set("linkora_pending_role", "", {maxAge: 0, path: "/"});
        res.cookies.set("linkora_next", "", {maxAge: 0, path: "/"});
        return res;
    }

    const {data: rolesBeforeRows} = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const rolesBefore = rolesBeforeRows ?? [];
    const isFirstGoogleSignup = isGoogleIdentity(user) && rolesBefore.length === 0;

    if (isFirstGoogleSignup) {
        const firstRole = pending === "owner" ? "owner" : "provider";
        await supabase
            .from("user_roles")
            .upsert({user_id: user.id, role: firstRole}, {onConflict: "user_id,role"});
        await supabase.from("profiles").upsert({id: user.id, role: firstRole}, {onConflict: "id"});
    } else if (pending === "owner" || pending === "provider") {
        await supabase
            .from("user_roles")
            .upsert({user_id: user.id, role: pending}, {onConflict: "user_id,role"});
        await supabase.from("profiles").upsert({id: user.id, role: pending}, {onConflict: "id"});
    }

    await syncOAuthAvatarIfMissing(supabase, user);

    const {data: profileRow} = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const profileRole = profileRow?.role;

    const res = NextResponse.redirect(new URL(next, url.origin));
    res.cookies.set("linkora_pending_role", "", {maxAge: 0, path: "/"});
    res.cookies.set("linkora_next", "", {maxAge: 0, path: "/"});

    const active =
        profileRole === "owner" || profileRole === "provider"
            ? profileRole
            : pending === "owner" || pending === "provider"
                ? pending
                : "provider";

    res.cookies.set("linkora_active_role", active, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
    });

    return res;
}
