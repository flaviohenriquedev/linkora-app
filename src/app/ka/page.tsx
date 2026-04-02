import type { Metadata } from "next";
import { KaChat } from "@/components/ka/KaChat";

export const metadata: Metadata = {
  title: "IA Ka — Linkora",
};

export default function KaPage() {
  return (
    <main className="min-h-[calc(100vh-72px)]">
      <KaChat />
    </main>
  );
}
