import type { Metadata } from "next";
import { ProfessionalsExplorer } from "@/components/professionals/ProfessionalsExplorer";

export const metadata: Metadata = {
  title: "Profissionais — LINKORA",
  description: "Encontre estilistas, modelistas e fornecedores da moda.",
};

export default function ProfessionalsPage() {
  return (
    <main className="min-h-[calc(100vh-72px)]">
      <ProfessionalsExplorer />
    </main>
  );
}
