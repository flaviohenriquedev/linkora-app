import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfessionalProfile } from "@/components/profile/ProfessionalProfile";
import { getActiveRoleCookie } from "@/lib/auth/activeRole";
import { tryCreateClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Perfil — LINKORA",
};

export default async function ProfilePage() {
  const supabase = await tryCreateClient();
  if (!supabase) {
    redirect("/login?next=/profile");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/profile");
  }

  const activeRole = await getActiveRoleCookie();
  if (activeRole === "owner") {
    redirect("/owner");
  }
  if (activeRole === "provider") {
    return (
      <main className="min-h-[calc(100vh-72px)]">
        <ProfessionalProfile />
      </main>
    );
  }

  const { data: row } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (row?.role === "owner") {
    redirect("/owner");
  }

  return (
    <main className="min-h-[calc(100vh-72px)]">
      <ProfessionalProfile />
    </main>
  );
}
