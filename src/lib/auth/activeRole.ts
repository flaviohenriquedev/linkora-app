import { cookies } from "next/headers";

export type ActiveRole = "owner" | "provider";

export async function getActiveRoleCookie(): Promise<ActiveRole | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get("linkora_active_role")?.value;
  if (value === "owner" || value === "provider") return value;
  return null;
}
