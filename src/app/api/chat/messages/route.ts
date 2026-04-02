import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tryCreateClient } from "@/lib/supabase/server";

type Msg = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  reply_to_id: string | null;
};

async function enrichMessagesWithReplyTo(
  supabase: SupabaseClient,
  messages: Msg[],
): Promise<
  (Msg & {
    reply_to: { id: string; sender_id: string; body: string } | null;
  })[]
> {
  const ids = [...new Set(messages.map((m) => m.reply_to_id).filter(Boolean))] as string[];
  if (!ids.length) {
    return messages.map((m) => ({ ...m, reply_to: null }));
  }
  const { data: parents } = await supabase.from("chat_messages").select("id, sender_id, body").in("id", ids);
  const map = new Map((parents ?? []).map((p) => [p.id, p]));
  return messages.map((m) => ({
    ...m,
    reply_to: m.reply_to_id ? map.get(m.reply_to_id) ?? null : null,
  }));
}

async function enrichOneMessage(
  supabase: SupabaseClient,
  row: Msg,
): Promise<Msg & { reply_to: { id: string; sender_id: string; body: string } | null }> {
  const [out] = await enrichMessagesWithReplyTo(supabase, [row]);
  return out!;
}

async function assertParticipant(threadId: string, userId: string) {
  const supabase = await tryCreateClient();
  if (!supabase) return { ok: false as const, status: 503, error: "Supabase indisponível" };
  const { data: thread } = await supabase
    .from("chat_threads")
    .select("id, owner_id, provider_id")
    .eq("id", threadId)
    .maybeSingle();
  if (!thread) return { ok: false as const, status: 404, error: "Conversa não encontrada" };
  if (thread.owner_id !== userId && thread.provider_id !== userId) {
    return { ok: false as const, status: 403, error: "Acesso negado" };
  }
  return { ok: true as const, supabase };
}

export async function GET(request: Request) {
  const supabase = await tryCreateClient();
  if (!supabase) return NextResponse.json({ error: "Supabase indisponível" }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("threadId");
  if (!threadId) return NextResponse.json({ error: "threadId obrigatório" }, { status: 400 });

  const limitRaw = parseInt(searchParams.get("limit") ?? "40", 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(100, Math.max(1, limitRaw)) : 40;
  const before = searchParams.get("before");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const check = await assertParticipant(threadId, user.id);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  let q = check.supabase
    .from("chat_messages")
    .select("id, thread_id, sender_id, body, read_at, created_at, reply_to_id")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  if (before) {
    q = q.lt("created_at", before);
  }
  if (dateFrom) {
    q = q.gte("created_at", dateFrom);
  }
  if (dateTo) {
    q = q.lte("created_at", dateTo);
  }

  const { data, error } = await q;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const list = ((data ?? []) as Msg[]).slice().reverse();
  const messages = await enrichMessagesWithReplyTo(check.supabase, list);
  const hasMore = (data ?? []).length === limit;
  return NextResponse.json({ messages, hasMore });
}

export async function POST(request: Request) {
  const supabase = await tryCreateClient();
  if (!supabase) return NextResponse.json({ error: "Supabase indisponível" }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const threadId = typeof body.threadId === "string" ? body.threadId : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const replyToMessageId =
    typeof body.replyToMessageId === "string" && body.replyToMessageId.length > 0
      ? body.replyToMessageId
      : null;

  if (!threadId) return NextResponse.json({ error: "threadId obrigatório" }, { status: 400 });
  if (!text) return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });

  const check = await assertParticipant(threadId, user.id);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  if (replyToMessageId) {
    const { data: parent } = await check.supabase
      .from("chat_messages")
      .select("id, thread_id")
      .eq("id", replyToMessageId)
      .maybeSingle();
    if (!parent || parent.thread_id !== threadId) {
      return NextResponse.json({ error: "Mensagem citada inválida" }, { status: 400 });
    }
  }

  const { data, error } = await check.supabase
    .from("chat_messages")
    .insert({
      thread_id: threadId,
      sender_id: user.id,
      body: text,
      ...(replyToMessageId ? { reply_to_id: replyToMessageId } : {}),
    })
    .select("id, thread_id, sender_id, body, read_at, created_at, reply_to_id")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Falha ao enviar mensagem" }, { status: 500 });
  }

  const message = await enrichOneMessage(check.supabase, data as Msg);

  // Notificação opcional (webhook externo): apenas na 1a mensagem da conversa.
  try {
    const { count } = await check.supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("thread_id", threadId);
    if (count === 1 && process.env.CHAT_NOTIFY_WEBHOOK_URL) {
      const { data: thread } = await check.supabase
        .from("chat_threads")
        .select("owner_id, provider_id")
        .eq("id", threadId)
        .maybeSingle();
      const providerId = thread?.provider_id ?? null;
      if (providerId) {
        const [{ data: sender }, { data: provider }, { data: contacts }] = await Promise.all([
          check.supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
          check.supabase.from("profiles").select("full_name").eq("id", providerId).maybeSingle(),
          check.supabase
            .from("provider_contacts")
            .select("type, value, label")
            .eq("provider_id", providerId)
            .eq("is_public", true),
        ]);
        void fetch(process.env.CHAT_NOTIFY_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "chat_started",
            providerId,
            providerName: provider?.full_name ?? null,
            senderName: sender?.full_name ?? null,
            firstMessage: text,
            contacts: contacts ?? [],
          }),
        });
      }
    }
  } catch {
    // Notificação não pode bloquear o fluxo do chat.
  }

  return NextResponse.json({ message });
}
