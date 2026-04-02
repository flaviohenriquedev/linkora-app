import type { Metadata } from "next";
import { ChatInterface } from "@/components/chat/ChatInterface";

export const metadata: Metadata = {
  title: "Mensagens — LINKORA",
};

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string; peer?: string; thread?: string; self?: string }>;
}) {
  const sp = await searchParams;
  const peer =
    typeof sp.peer === "string" ? sp.peer : typeof sp.provider === "string" ? sp.provider : null;
  const thread = typeof sp.thread === "string" ? sp.thread : null;
  const selfRaw = typeof sp.self === "string" ? sp.self : "";
  const initialSelfNotes = selfRaw === "1" || selfRaw.toLowerCase() === "true";
  return (
    <main className="min-h-[calc(100vh-72px)] py-6">
      <ChatInterface
        initialPeerId={peer}
        initialThreadId={thread}
        initialSelfNotes={initialSelfNotes}
      />
    </main>
  );
}
