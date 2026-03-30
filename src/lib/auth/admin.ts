import { createClient } from "@/lib/supabase/server";

export async function isCurrentUserAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { isAdmin: false, user: null as null };

  const { data: row, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return { isAdmin: false, user };
  return { isAdmin: Boolean(row), user };
}
