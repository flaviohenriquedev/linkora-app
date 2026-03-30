import type { Metadata } from "next";
import { UserProfileView } from "@/components/user/UserProfileView";

export const metadata: Metadata = {
  title: "Meu Perfil — LINKORA",
};

export default function UserProfilePage() {
  return (
    <main className="min-h-[calc(100vh-72px)]">
      <UserProfileView />
    </main>
  );
}
