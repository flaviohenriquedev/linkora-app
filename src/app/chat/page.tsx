import type { Metadata } from "next";
import { ChatInterface } from "@/components/chat/ChatInterface";

export const metadata: Metadata = {
  title: "Mensagens — LINKORA",
};

export default function ChatPage() {
  return (
    <main className="min-h-[calc(100vh-72px)] py-6">
      <ChatInterface />
    </main>
  );
}
