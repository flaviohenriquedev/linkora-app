import type { Metadata } from "next";
import { ProfessionalProfile } from "@/components/profile/ProfessionalProfile";

export const metadata: Metadata = {
  title: "Perfil — LINKORA",
};

export default function ProfilePage() {
  return (
    <main className="min-h-[calc(100vh-72px)]">
      <ProfessionalProfile />
    </main>
  );
}
