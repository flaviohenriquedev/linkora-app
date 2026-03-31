import { redirect } from "next/navigation";
import { tryCreateClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function UserProfilePage() {
  const supabase = await tryCreateClient();
  if (!supabase) {
    redirect("/login?next=/user-profile");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/user-profile");
  }

  redirect("/owner");
}
