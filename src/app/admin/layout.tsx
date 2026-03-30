import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/auth/admin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { isAdmin, user } = await isCurrentUserAdmin();

  if (!user) {
    redirect("/login?next=/admin");
  }
  if (!isAdmin) {
    redirect("/");
  }

  return <>{children}</>;
}
