import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserProfileView } from "@/components/user/UserProfileView";
import { getActiveRoleCookie } from "@/lib/auth/activeRole";
import { tryCreateClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Área do proprietário — LINKORA",
};

export default async function OwnerHomePage() {
  const supabase = await tryCreateClient();
  if (!supabase) {
    redirect("/login?next=/owner");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/owner");
  }

  const activeRole = await getActiveRoleCookie();
  if (activeRole === "provider") {
    redirect("/profile");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "provider") {
    redirect("/profile");
  }

  return (
    <main className="min-h-[calc(100vh-72px)]">
      <UserProfileView />
    </main>
  );
}
