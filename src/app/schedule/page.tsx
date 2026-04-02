import type { Metadata } from "next";
import { ScheduleWizard } from "@/components/schedule/ScheduleWizard";

export const metadata: Metadata = {
  title: "Agendar — Linkora",
};

export default function SchedulePage() {
  return (
    <main className="min-h-[calc(100vh-72px)]">
      <ScheduleWizard />
    </main>
  );
}
