import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { tryCreateClient } from "@/lib/supabase/server";

function escapeIlikePattern(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

async function signedAvatarUrlByFileId(
  supabase: SupabaseClient,
  fileIds: (string | null | undefined)[],
): Promise<Map<string, string>> {
  const ids = [...new Set(fileIds.filter((x): x is string => Boolean(x)))];
  if (!ids.length) return new Map();
  const { data: files } = await supabase.from("files").select("id, storage_path, bucket").in("id", ids);
  const map = new Map<string, string>();
  for (const f of files ?? []) {
    if (!f.storage_path) continue;
    const bucket = f.bucket ?? "linkora-files";
    const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(f.storage_path, 3600);
    if (signed?.signedUrl) map.set(f.id, signed.signedUrl);
  }
  return map;
}

type ThreadRow = {
  id: string;
  owner_id: string;
  provider_id: string;
  updated_at: string;
  last_message_at: string | null;
};

type ChatPresence = "online" | "away" | "offline";

function threadPresenceFromRow(
  p: { status: string; last_seen_at: string } | undefined,
  now: number,
): ChatPresence {
  if (!p) return "offline";
  const age = now - new Date(p.last_seen_at).getTime();
  const fresh2m = age <= 2 * 60 * 1000;
  const fresh12m = age <= 12 * 60 * 1000;
  if (p.status === "online" && fresh2m) return "online";
  if (p.status === "away" && fresh12m) return "away";
  if (p.status === "online" && fresh12m) return "away";
  return "offline";
}

export async function GET(request: Request) {
  const supabase = await tryCreateClient();
  if (!supabase) return NextResponse.json({ error: "Supabase indisponível" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const qRaw = searchParams.get("q")?.trim() ?? "";
  const threadLimit = qRaw ? 100 : 50;

  const { data: threads, error } = await supabase
    .from("chat_threads")
    .select("id, owner_id, provider_id, updated_at, last_message_at")
    .or(`owner_id.eq.${user.id},provider_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(threadLimit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (threads ?? []) as ThreadRow[];
  const counterpartIds = [
    ...new Set(rows.map((t) => (t.owner_id === user.id ? t.provider_id : t.owner_id))),
  ];

  const [{ data: profiles }, { data: presence }, { data: lastMessages }] = await Promise.all([
    counterpartIds.length
      ? supabase
          .from("profiles")
          .select("id, full_name, role, avatar_file_id")
          .in("id", counterpartIds)
      : Promise.resolve({
          data: [] as Array<{
            id: string;
            full_name: string | null;
            role: string;
            avatar_file_id: string | null;
          }>,
        }),
    counterpartIds.length
      ? supabase.from("chat_presence").select("user_id, status, last_seen_at").in("user_id", counterpartIds)
      : Promise.resolve({ data: [] as Array<{ user_id: string; status: string; last_seen_at: string }> }),
    rows.length
      ? supabase
          .from("chat_messages")
          .select("thread_id, body, created_at")
          .in(
            "thread_id",
            rows.map((r) => r.id),
          )
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as Array<{ thread_id: string; body: string; created_at: string }> }),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const avatarByFileId = await signedAvatarUrlByFileId(
    supabase,
    (profiles ?? []).map((p) => p.avatar_file_id),
  );
  const presenceMap = new Map((presence ?? []).map((p) => [p.user_id, p]));
  const lastMessageMap = new Map<string, { body: string; created_at: string }>();
  for (const m of lastMessages ?? []) {
    if (!lastMessageMap.has(m.thread_id)) lastMessageMap.set(m.thread_id, m);
  }

  const now = Date.now();
  const threadList = rows.map((t) => {
    const counterpartId = t.owner_id === user.id ? t.provider_id : t.owner_id;
    const isSelfNotes = t.owner_id === t.provider_id;
    const counterpart = profileMap.get(counterpartId);
    const p = presenceMap.get(counterpartId);
    const last = lastMessageMap.get(t.id);
    const avId = counterpart?.avatar_file_id;
    return {
      id: t.id,
      isSelfNotes,
      counterpart: {
        id: counterpartId,
        name: isSelfNotes
          ? "Notas para mim"
          : counterpart?.full_name?.trim() || "Usuário Linkora",
        role: counterpart?.role ?? "owner",
        avatarUrl: avId ? avatarByFileId.get(avId) ?? null : null,
      },
      lastMessage: last?.body ?? null,
      lastMessageAt: last?.created_at ?? t.last_message_at ?? t.updated_at,
      status: threadPresenceFromRow(p, now),
    };
  });

  threadList.sort((a, b) => {
    if (a.isSelfNotes && !b.isSelfNotes) return -1;
    if (!a.isSelfNotes && b.isSelfNotes) return 1;
    const ta = new Date(a.lastMessageAt).getTime();
    const tb = new Date(b.lastMessageAt).getTime();
    return tb - ta;
  });

  if (!qRaw) {
    return NextResponse.json({ threads: threadList });
  }

  const needle = qRaw.toLowerCase();
  const matchIds = new Set<string>();

  for (const t of threadList) {
    const name = (t.counterpart.name || "").toLowerCase();
    if (name.includes(needle)) matchIds.add(t.id);
  }

  try {
    const admin = createAdminClient();
    const cids = [...new Set(threadList.map((t) => t.counterpart.id))];
    const emails = await Promise.all(
      cids.map(async (cid) => {
        const { data } = await admin.auth.admin.getUserById(cid);
        return { id: cid, email: (data.user?.email ?? "").toLowerCase() };
      }),
    );
    for (const { id, email } of emails) {
      if (email.includes(needle)) {
        for (const t of threadList) {
          if (t.counterpart.id === id) matchIds.add(t.id);
        }
      }
    }
  } catch {
    // Sem service role: pesquisa por e-mail fica desativada; nome e texto de mensagem continuam.
  }

  const threadIds = rows.map((r) => r.id);
  if (threadIds.length) {
    const pattern = `%${escapeIlikePattern(qRaw)}%`;
    const { data: msgHits } = await supabase
      .from("chat_messages")
      .select("thread_id")
      .in("thread_id", threadIds)
      .ilike("body", pattern);
    for (const h of msgHits ?? []) {
      if (h.thread_id) matchIds.add(h.thread_id);
    }
  }

  const filtered = threadList.filter((t) => matchIds.has(t.id));
  filtered.sort((a, b) => {
    if (a.isSelfNotes && !b.isSelfNotes) return -1;
    if (!a.isSelfNotes && b.isSelfNotes) return 1;
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
  });

  return NextResponse.json({ threads: filtered });
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

  const peerIdRaw =
    typeof body.peerId === "string"
      ? body.peerId
      : typeof body.providerId === "string"
        ? body.providerId
        : "";
  if (!peerIdRaw) {
    return NextResponse.json({ error: "peerId ou providerId obrigatório" }, { status: 400 });
  }

  if (peerIdRaw === user.id) {
    const { data: selfProf } = await supabase
      .from("profiles")
      .select("id, is_active")
      .eq("id", user.id)
      .maybeSingle();
    if (!selfProf?.is_active) {
      return NextResponse.json({ error: "Perfil indisponível" }, { status: 404 });
    }
    const { data: upsertedSelf, error: errSelf } = await supabase
      .from("chat_threads")
      .upsert(
        {
          owner_id: user.id,
          provider_id: user.id,
          created_by: user.id,
        },
        { onConflict: "owner_id,provider_id" },
      )
      .select("id, owner_id, provider_id")
      .maybeSingle();
    if (errSelf || !upsertedSelf) {
      return NextResponse.json({ error: errSelf?.message ?? "Falha ao abrir notas" }, { status: 500 });
    }
    return NextResponse.json({ thread: upsertedSelf });
  }

  const { data: peer } = await supabase
    .from("profiles")
    .select("id, is_active")
    .eq("id", peerIdRaw)
    .maybeSingle();

  if (!peer?.is_active) {
    return NextResponse.json({ error: "Utilizador não encontrado ou inativo" }, { status: 404 });
  }

  /** Par canónico: mesma ordem que o upsert na BD (uma thread por par de utilizadores). */
  const [ownerId, providerId] =
    user.id < peer.id ? [user.id, peer.id] : [peer.id, user.id];

  const { data: upserted, error } = await supabase
    .from("chat_threads")
    .upsert(
      {
        owner_id: ownerId,
        provider_id: providerId,
        created_by: user.id,
      },
      { onConflict: "owner_id,provider_id" },
    )
    .select("id, owner_id, provider_id")
    .maybeSingle();

  if (error || !upserted) {
    return NextResponse.json({ error: error?.message ?? "Falha ao abrir conversa" }, { status: 500 });
  }

  return NextResponse.json({ thread: upserted });
}
