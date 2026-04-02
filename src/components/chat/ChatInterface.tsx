"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";

type ThreadItem = {
  id: string;
  isSelfNotes?: boolean;
  counterpart: { id: string; name: string; role: string; avatarUrl?: string | null };
  lastMessage: string | null;
  lastMessageAt: string;
  status: "online" | "away" | "offline";
};

type MessageRow = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  reply_to_id: string | null;
  reply_to?: { id: string; sender_id: string; body: string } | null;
};

type ReplyDraft = { id: string; body: string; sender_id: string };

const TEXTAREA_MAX_HEIGHT_PX = 160;

function replyQuoteLabel(senderId: string, myId: string | null, counterpartName: string) {
  if (myId && senderId === myId) return "Você";
  return counterpartName.trim() || "Usuário";
}

function replyBarTitle(senderId: string, myId: string | null, counterpartName: string) {
  if (myId && senderId === myId) return "Respondendo a você";
  const n = counterpartName.trim() || "Usuário";
  return `Respondendo a ${n}`;
}

type Props = {
  initialPeerId?: string | null;
  initialThreadId?: string | null;
  /** Abre a conversa “Notas para mim” (mensagem para si). */
  initialSelfNotes?: boolean;
};

function presenceSubtitle(status: ThreadItem["status"]) {
  if (status === "online") return { text: "Online", className: "text-green-light" };
  if (status === "away") return { text: "Ausente", className: "text-gold" };
  return { text: "Offline", className: "text-text-muted" };
}

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "LK";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return `${p[0]![0] ?? ""}${p[p.length - 1]![0] ?? ""}`.toUpperCase();
}

function timeLabel(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "--:--";
  }
}

/** Chave YYYY-MM-DD no fuso local (para agrupar / filtrar). */
function dayKeyLocal(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayLabelFromKey(dayKey: string): string {
  const today = dayKeyLocal(new Date().toISOString());
  const yd = new Date();
  yd.setDate(yd.getDate() - 1);
  const yesterday = dayKeyLocal(yd.toISOString());
  if (dayKey === today) return "Hoje";
  if (dayKey === yesterday) return "Ontem";
  const parts = dayKey.split("-").map(Number);
  const dt = new Date(parts[0]!, parts[1]! - 1, parts[2]!);
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function groupMessagesByDay(messages: MessageRow[]): { dayKey: string; label: string; items: MessageRow[] }[] {
  const groups: { dayKey: string; label: string; items: MessageRow[] }[] = [];
  for (const m of messages) {
    const key = dayKeyLocal(m.created_at);
    const last = groups[groups.length - 1];
    if (last && last.dayKey === key) {
      last.items.push(m);
    } else {
      groups.push({ dayKey: key, label: dayLabelFromKey(key), items: [m] });
    }
  }
  return groups;
}

function ChatAvatar({
  url,
  name,
  className = "h-9 w-9",
}: {
  url: string | null | undefined;
  name: string;
  className?: string;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-main text-xs font-bold text-white ${className}`}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL assinada
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-[11px] sm:text-xs">{initials(name)}</span>
      )}
    </div>
  );
}

function useMdUp() {
  const [isMd, setIsMd] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const fn = () => setIsMd(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return isMd;
}

export function ChatInterface({
  initialPeerId = null,
  initialThreadId = null,
  initialSelfNotes = false,
}: Props) {
  const { avatarUrl: myAvatarUrl, profile } = useAuth();
  const myDisplayName = profile?.full_name?.trim() || "Você";
  const isMd = useMdUp();

  const [mobilePanel, setMobilePanel] = useState<"list" | "chat">("list");
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(() => initialThreadId ?? null);
  const [rows, setRows] = useState<MessageRow[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [replyTarget, setReplyTarget] = useState<ReplyDraft | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [typingPeerId, setTypingPeerId] = useState<string | null>(null);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [threadSearchInput, setThreadSearchInput] = useState("");
  const [debouncedThreadSearch, setDebouncedThreadSearch] = useState("");
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const typingSendRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingCooldownRef = useRef(0);
  const initialThreadIdRef = useRef(initialThreadId);
  initialThreadIdRef.current = initialThreadId;
  const lastLoadedThreadRef = useRef<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedThreadSearch(threadSearchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [threadSearchInput]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) ?? null,
    [threads, activeThreadId],
  );

  const messageGroups = useMemo(() => groupMessagesByDay(rows), [rows]);

  const showList = isMd || mobilePanel === "list";
  const showChat = isMd || mobilePanel === "chat";

  const loadThreads = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoadingThreads(true);
    try {
      const q = debouncedThreadSearch;
      const url = q
        ? `/api/chat/threads?q=${encodeURIComponent(q)}`
        : "/api/chat/threads";
      const res = await fetch(url, { cache: "no-store" });
      const json = (await res.json()) as { threads?: ThreadItem[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Falha ao carregar conversas");
      const list = json.threads ?? [];
      setThreads(list);
      setActiveThreadId((prev) => {
        const want = initialThreadIdRef.current;
        if (want && list.some((t) => t.id === want)) return want;
        if (prev && list.some((t) => t.id === prev)) return prev;
        const md =
          typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
        if (!list.length) return null;
        if (md) return list[0]!.id;
        // Mobile: conversa anterior deixou de existir (ex.: apagada) — volta à lista sem seleção
        return null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar conversas");
    } finally {
      if (!opts?.silent) setLoadingThreads(false);
    }
  }, [debouncedThreadSearch]);

  const refreshThreadsQuiet = useCallback(() => void loadThreads({ silent: true }), [loadThreads]);

  const markThreadRead = useCallback(async (threadId: string) => {
    await fetch("/api/chat/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId }),
    });
  }, []);

  const loadMessagesPage = useCallback(
    async (
      threadId: string,
      opts: { reset: boolean; before?: string; ignoreDateFilter?: boolean },
    ) => {
      if (opts.reset) setLoadingMessages(true);
      try {
        const params = new URLSearchParams({
          threadId,
          limit: "40",
        });
        if (opts.before) params.set("before", opts.before);
        const day = opts.ignoreDateFilter ? null : filterDate;
        if (day) {
          const start = new Date(`${day}T00:00:00`);
          const end = new Date(`${day}T23:59:59.999`);
          params.set("dateFrom", start.toISOString());
          params.set("dateTo", end.toISOString());
        }
        const res = await fetch(`/api/chat/messages?${params}`, { cache: "no-store" });
        const json = (await res.json()) as {
          messages?: MessageRow[];
          hasMore?: boolean;
          error?: string;
        };
        if (!res.ok) throw new Error(json.error ?? "Falha ao carregar mensagens");
        const incoming = json.messages ?? [];
        setHasMoreOlder(json.hasMore ?? false);
        setRows((prev) => {
          if (opts.reset) return incoming;
          const seen = new Set(incoming.map((m) => m.id));
          return [...incoming, ...prev.filter((m) => !seen.has(m.id))];
        });
        if (opts.reset) {
          setTimeout(() => endRef.current?.scrollIntoView({ behavior: "auto" }), 0);
          void markThreadRead(threadId);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao carregar mensagens");
      } finally {
        if (opts.reset) setLoadingMessages(false);
      }
    },
    [filterDate, markThreadRead],
  );

  const loadOlderMessages = useCallback(async () => {
    if (!activeThreadId || !hasMoreOlder || loadingOlder || rows.length === 0) return;
    const oldest = rows[0];
    if (!oldest) return;
    setLoadingOlder(true);
    const scrollEl = messagesScrollRef.current;
    const prevH = scrollEl?.scrollHeight ?? 0;
    try {
      await loadMessagesPage(activeThreadId, { reset: false, before: oldest.created_at });
      requestAnimationFrame(() => {
        if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight - prevH;
      });
    } finally {
      setLoadingOlder(false);
    }
  }, [activeThreadId, hasMoreOlder, loadingOlder, rows, loadMessagesPage]);

  useEffect(() => {
    void loadThreads({ silent: false });
  }, [loadThreads]);

  useEffect(() => {
    if (!initialThreadId) return;
    setActiveThreadId(initialThreadId);
    setMobilePanel("chat");
  }, [initialThreadId]);

  useEffect(() => {
    if (!activeThreadId) {
      lastLoadedThreadRef.current = null;
      setRows([]);
      setHasMoreOlder(false);
      return;
    }
    if (lastLoadedThreadRef.current !== activeThreadId) {
      lastLoadedThreadRef.current = activeThreadId;
      setFilterDate(null);
      setRows([]);
      setHasMoreOlder(true);
      setError(null);
      void loadMessagesPage(activeThreadId, { reset: true, ignoreDateFilter: true });
      return;
    }
    setRows([]);
    setHasMoreOlder(true);
    setError(null);
    void loadMessagesPage(activeThreadId, { reset: true });
  }, [activeThreadId, filterDate, loadMessagesPage]);

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el || !activeThreadId) return;
    const onScroll = () => {
      if (el.scrollHeight <= el.clientHeight + 1) return;
      if (el.scrollTop > 72) return;
      if (!hasMoreOlder || loadingOlder || loadingMessages || rows.length === 0) return;
      void loadOlderMessages();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [activeThreadId, hasMoreOlder, loadingOlder, loadingMessages, rows.length, loadOlderMessages]);

  useLayoutEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_HEIGHT_PX)}px`;
  }, [text]);

  useEffect(() => {
    const setPresence = (status: "online" | "away" | "offline") => {
      // keepalive ajuda a atualizar o status durante logout/navegação rápida
      void fetch("/api/chat/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        keepalive: true,
      });
    };

    setPresence("online");
    const id = setInterval(() => setPresence("online"), 30000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") setPresence("away");
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const onBeforeUnload = () => setPresence("offline");
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
      setPresence("offline");
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refreshThreadsQuiet();
    }, 60000);
    return () => clearInterval(id);
  }, [refreshThreadsQuiet]);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (mounted) setMyId(data.user?.id ?? null);
      })
      .catch(() => {
        if (mounted) setMyId(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activeThreadId) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`chat-messages-${activeThreadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${activeThreadId}`,
        },
        (payload) => {
          const raw = payload.new as MessageRow;
          if (filterDate && dayKeyLocal(raw.created_at) !== filterDate) {
            refreshThreadsQuiet();
            return;
          }
          setRows((prev) => {
            const merged: MessageRow =
              raw.reply_to_id && !raw.reply_to
                ? {
                    ...raw,
                    reply_to: (() => {
                      const parent = prev.find((x) => x.id === raw.reply_to_id);
                      return parent
                        ? { id: parent.id, sender_id: parent.sender_id, body: parent.body }
                        : null;
                    })(),
                  }
                : raw;
            return prev.some((p) => p.id === merged.id) ? prev : [...prev, merged];
          });
          setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
          refreshThreadsQuiet();
          if (raw.sender_id !== myId) void markThreadRead(activeThreadId);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${activeThreadId}`,
        },
        (payload) => {
          const message = payload.new as MessageRow;
          setRows((prev) => prev.map((m) => (m.id === message.id ? { ...m, ...message } : m)));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [activeThreadId, refreshThreadsQuiet, myId, markThreadRead, filterDate]);

  useEffect(() => {
    if (!activeThreadId || !myId) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`chat-typing-${activeThreadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_typing",
          filter: `thread_id=eq.${activeThreadId}`,
        },
        (payload) => {
          const row = payload.new as { user_id?: string; updated_at?: string };
          if (!row.user_id || row.user_id === myId) return;
          const ts = row.updated_at ? new Date(row.updated_at).getTime() : 0;
          if (Date.now() - ts > 6000) return;
          setTypingPeerId(row.user_id);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_typing",
          filter: `thread_id=eq.${activeThreadId}`,
        },
        (payload) => {
          const row = payload.new as { user_id?: string; updated_at?: string };
          if (!row.user_id || row.user_id === myId) return;
          const ts = row.updated_at ? new Date(row.updated_at).getTime() : 0;
          if (Date.now() - ts > 6000) return;
          setTypingPeerId(row.user_id);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [activeThreadId, myId]);

  useEffect(() => {
    if (!typingPeerId) return;
    const t = setTimeout(() => setTypingPeerId(null), 5000);
    return () => clearTimeout(t);
  }, [typingPeerId]);

  function sendTypingPing(threadId: string) {
    const now = Date.now();
    if (now - typingCooldownRef.current < 2500) return;
    typingCooldownRef.current = now;
    void fetch("/api/chat/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId }),
    });
  }

  useEffect(() => {
    if (!initialPeerId || initialThreadId) return;
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/chat/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId: initialPeerId }),
      });
      const json = (await res.json()) as { thread?: { id: string }; error?: string };
      if (cancelled) return;
      if (!res.ok || !json.thread?.id) {
        setError(json.error ?? "Não foi possível iniciar conversa.");
        return;
      }
      setActiveThreadId(json.thread.id);
      setMobilePanel("chat");
      await loadThreads({ silent: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [initialPeerId, initialThreadId, loadThreads]);

  useEffect(() => {
    if (!initialSelfNotes || initialThreadId || initialPeerId || !myId) return;
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/chat/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId: myId }),
      });
      const json = (await res.json()) as { thread?: { id: string }; error?: string };
      if (cancelled) return;
      if (!res.ok || !json.thread?.id) {
        setError(json.error ?? "Não foi possível abrir as notas.");
        return;
      }
      setActiveThreadId(json.thread.id);
      setMobilePanel("chat");
      await loadThreads({ silent: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [initialSelfNotes, initialThreadId, initialPeerId, myId, loadThreads]);

  function scrollToQuotedMessage(messageId: string) {
    const el = document.querySelector(`[data-message-id="${messageId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  useEffect(() => {
    if (!replyTarget) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setReplyTarget(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [replyTarget]);

  async function send() {
    const t = text.trim();
    if (!t || !activeThreadId) return;
    const replyId = replyTarget?.id;
    setText("");
    setReplyTarget(null);
    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId: activeThreadId,
        text: t,
        ...(replyId ? { replyToMessageId: replyId } : {}),
      }),
    });
    const json = (await res.json()) as { message?: MessageRow; error?: string };
    if (!res.ok || !json.message) {
      setError(json.error ?? "Falha ao enviar");
      return;
    }
    const msg = json.message;
    if (!filterDate || dayKeyLocal(msg.created_at) === filterDate) {
      setRows((r) => (r.some((m) => m.id === msg.id) ? r : [...r, msg]));
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    }
    refreshThreadsQuiet();
  }

  function onInputChange(v: string) {
    setText(v);
    if (!activeThreadId) return;
    if (typingSendRef.current) clearTimeout(typingSendRef.current);
    typingSendRef.current = setTimeout(() => {
      if (v.trim()) sendTypingPing(activeThreadId);
    }, 400);
  }

  function openThread(threadId: string) {
    setActiveThreadId(threadId);
    setMobilePanel("chat");
  }

  function mobileBackToList() {
    setMobilePanel("list");
  }

  async function deleteSelfNotesThread(threadId: string) {
    if (
      !confirm(
        "Apagar todas as notas desta conversa? Esta ação não pode ser desfeita.",
      )
    ) {
      return;
    }
    setDeletingThreadId(threadId);
    setError(null);
    try {
      const res = await fetch(`/api/chat/threads/${encodeURIComponent(threadId)}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Falha ao apagar");
      if (activeThreadId === threadId) {
        setRows([]);
        setReplyTarget(null);
      }
      const isMobile =
        typeof window !== "undefined" && !window.matchMedia("(min-width: 768px)").matches;
      if (isMobile && activeThreadId === threadId) {
        setMobilePanel("list");
      }
      await loadThreads({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao apagar");
    } finally {
      setDeletingThreadId(null);
    }
  }

  const chatPanelHeightMd = "md:h-[calc(100dvh-8rem)] md:min-h-0";

  const panelShell = "flex flex-col overflow-hidden bg-bg-card md:rounded-2xl md:border md:border-border";

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col gap-0 px-0 pb-[max(1rem,env(safe-area-inset-bottom))] pt-0 sm:px-4 sm:pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pt-2 md:flex-row md:items-stretch md:gap-6 md:px-6">
      <aside
        className={`${panelShell} ${showList ? "flex" : "hidden"} min-h-[calc(100dvh-5rem)] w-full shrink-0 md:flex md:min-h-0 md:w-[320px] ${chatPanelHeightMd}`}
      >
        <div className="border-b border-border px-4 py-4 sm:px-5 sm:py-5 md:px-5">
          <h2 className="text-xl font-semibold">Mensagens</h2>
          <label className="mt-3 block text-[11px] text-text-muted" htmlFor="chat-thread-search">
            Pesquisar conversas
          </label>
          <input
            id="chat-thread-search"
            type="search"
            value={threadSearchInput}
            onChange={(e) => setThreadSearchInput(e.target.value)}
            placeholder="Nome, e-mail ou texto…"
            className="mt-1.5 w-full min-h-[44px] rounded-xl border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-gold"
            autoComplete="off"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingThreads ? <p className="px-4 py-4 text-sm text-text-muted sm:px-5">Carregando conversas...</p> : null}
          {!loadingThreads && threads.length === 0 ? (
            <p className="px-4 py-4 text-sm text-text-muted sm:px-5">
              {debouncedThreadSearch.trim()
                ? "Nenhuma conversa encontrada para esta pesquisa."
                : "Nenhuma conversa ainda."}
            </p>
          ) : null}
          {threads.map((c) => {
            const active = c.id === activeThreadId;
            const selfNotes = Boolean(c.isSelfNotes);
            const rowHighlight = selfNotes
              ? active
                ? "border-l-[3px] border-l-gold bg-[rgba(201,168,76,0.14)] ring-1 ring-inset ring-gold/25"
                : "border-l-[3px] border-l-gold/40 bg-[rgba(201,168,76,0.07)] ring-1 ring-inset ring-gold/15 hover:bg-[rgba(201,168,76,0.11)]"
              : active
                ? "border-l-[3px] border-l-gold bg-[rgba(201,168,76,0.05)]"
                : "hover:bg-[rgba(201,168,76,0.05)]";
            return (
              <div
                key={c.id}
                className={`flex border-b border-border ${selfNotes ? "relative" : ""}`}
              >
                <button
                  type="button"
                  disabled={deletingThreadId === c.id}
                  onClick={() => openThread(c.id)}
                  className={`flex min-w-0 flex-1 gap-3 px-4 py-3 text-left transition sm:gap-4 sm:px-5 sm:py-4 ${rowHighlight}`}
                >
                  <ChatAvatar url={c.counterpart.avatarUrl} name={c.counterpart.name} className="h-12 w-12" />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <div className="min-w-0">
                        <strong className="truncate text-[15px]">{c.counterpart.name}</strong>
                        {selfNotes ? (
                          <span className="mt-0.5 block text-[11px] font-medium text-gold/90">
                            Suas notas — só você vê
                          </span>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-xs text-text-muted">{timeLabel(c.lastMessageAt)}</span>
                    </div>
                    <p className="truncate text-[13px] text-text-secondary">
                      {c.lastMessage || "Conversa iniciada"}
                    </p>
                  </div>
                </button>
                {selfNotes ? (
                  <button
                    type="button"
                    disabled={deletingThreadId === c.id}
                    onClick={() => void deleteSelfNotesThread(c.id)}
                    className="shrink-0 border-l border-border px-3 text-text-muted transition hover:bg-red-500/10 hover:text-red-400 sm:px-4"
                    aria-label="Apagar notas"
                    title="Apagar conversa de notas"
                  >
                    {deletingThreadId === c.id ? (
                      <span className="text-xs">…</span>
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M3 6h18" strokeLinecap="round" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </aside>

      <section
        className={`${panelShell} ${showChat ? "flex" : "hidden"} min-h-[calc(100dvh-5rem)] flex-1 md:flex md:min-h-0 ${chatPanelHeightMd}`}
      >
        <div className="flex items-center gap-3 border-b border-border px-3 py-3 sm:gap-4 sm:px-5 sm:py-4">
          {!isMd ? (
            <button
              type="button"
              onClick={mobileBackToList}
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-text-primary transition hover:bg-white/5"
              aria-label="Voltar às conversas"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : null}
          <ChatAvatar
            url={activeThread?.counterpart.avatarUrl}
            name={activeThread?.counterpart.name ?? "LK"}
            className="h-11 w-11 sm:h-12 sm:w-12"
          />
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-base">
              {activeThread?.counterpart.name ?? (showChat ? "Conversa" : "Selecione uma conversa")}
            </strong>
            {activeThread?.isSelfNotes ? (
              <span className="text-[13px] text-text-muted">Suas notas e lembretes</span>
            ) : activeThread ? (
              <span className={`text-[13px] ${presenceSubtitle(activeThread.status).className}`}>
                {presenceSubtitle(activeThread.status).text}
              </span>
            ) : null}
          </div>
        </div>
        {activeThreadId ? (
          <div className="flex flex-col gap-1.5 border-b border-border px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:px-5">
            <label className="sr-only" htmlFor="chat-msg-date-filter">
              Filtrar mensagens por data
            </label>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <input
                id="chat-msg-date-filter"
                type="date"
                value={filterDate ?? ""}
                onChange={(e) => setFilterDate(e.target.value || null)}
                className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus:border-gold sm:max-w-[min(100%,220px)]"
              />
              {filterDate ? (
                <button
                  type="button"
                  onClick={() => setFilterDate(null)}
                  className="shrink-0 rounded-lg px-3 py-2 text-sm text-gold transition hover:bg-white/5"
                >
                  Limpar filtro
                </button>
              ) : null}
            </div>
            {filterDate ? (
              <p className="w-full text-[11px] text-text-muted sm:w-auto">
                Mostrando só mensagens de{" "}
                {new Date(`${filterDate}T12:00:00`).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            ) : (
              <p className="text-[11px] text-text-muted">
                Dica: escolha uma data para ver só esse dia.
              </p>
            )}
          </div>
        ) : null}
        <div
          ref={messagesScrollRef}
          className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6"
        >
          {loadingOlder ? (
            <p className="mb-3 text-center text-xs text-text-muted">Carregando mensagens anteriores…</p>
          ) : null}
          {loadingMessages ? <p className="text-sm text-text-muted">Carregando mensagens...</p> : null}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {typingPeerId && activeThread?.counterpart && !activeThread.isSelfNotes ? (
            <p className="text-xs italic text-text-muted">
              {activeThread.counterpart.name} está digitando…
            </p>
          ) : null}
          {!activeThreadId && isMd ? (
            <p className="text-sm text-text-muted">Selecione uma conversa à esquerda.</p>
          ) : null}
          {activeThreadId && !loadingMessages && rows.length === 0 && !loadingOlder ? (
            <p className="py-6 text-center text-sm text-text-muted">
              {filterDate ? "Nenhuma mensagem neste dia." : "Nenhuma mensagem ainda."}
            </p>
          ) : null}
          {messageGroups.map((segment) => (
            <div key={segment.dayKey} className="mb-4 last:mb-0">
              <div className="sticky top-0 z-10 mb-3 flex justify-center py-1">
                <span className="rounded-full border border-border bg-bg-secondary/95 px-3 py-1 text-[11px] font-medium text-text-muted shadow-sm backdrop-blur-sm">
                  {segment.label}
                </span>
              </div>
              <div className="flex flex-col gap-3 sm:gap-4">
                {segment.items.map((m, i) => {
                  const mine = m.sender_id === myId;
                  const peerName = activeThread?.counterpart.name ?? "Usuário";
                  const avatarUrl = mine ? myAvatarUrl : activeThread?.counterpart.avatarUrl;
                  const avatarName = mine ? myDisplayName : peerName;
                  return (
              <div
                key={m.id || i}
                data-message-id={m.id}
                className={`flex max-w-[min(100%,520px)] gap-2 animate-fade-in sm:max-w-[min(100%,480px)] ${
                  mine ? "ml-auto flex-row-reverse" : "mr-auto flex-row"
                }`}
              >
                <div className="flex shrink-0 flex-col justify-end pb-1">
                  <ChatAvatar url={avatarUrl} name={avatarName} className="h-8 w-8" />
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`rounded-2xl px-3 py-2.5 text-sm sm:px-4 sm:py-3 ${
                      mine
                        ? "rounded-br-md bg-green-main text-white"
                        : "rounded-bl-md border border-border bg-bg-secondary text-text-primary"
                    }`}
                  >
                    {m.reply_to ? (
                      <button
                        type="button"
                        onClick={() => scrollToQuotedMessage(m.reply_to!.id)}
                        className={`mb-2 w-full border-l-[3px] text-left transition hover:opacity-95 ${
                          mine ? "border-white/70 pl-2" : "border-gold pl-2"
                        }`}
                      >
                        <span className={`block text-[11px] font-semibold ${mine ? "text-white/95" : "text-gold"}`}>
                          {replyQuoteLabel(m.reply_to.sender_id, myId, peerName)}
                        </span>
                        <span
                          className={`mt-0.5 line-clamp-3 text-[11px] leading-snug ${
                            mine ? "text-white/80" : "text-text-secondary"
                          }`}
                        >
                          {m.reply_to.body}
                        </span>
                      </button>
                    ) : null}
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <div
                      className={`mt-2 flex items-center justify-end gap-2 text-[11px] ${
                        mine ? "text-white/75" : "text-text-muted"
                      }`}
                    >
                      <span>{timeLabel(m.created_at)}</span>
                      {mine ? (
                        <span
                          className="inline-flex min-w-[1.25rem] leading-none"
                          title={m.read_at ? "Lida" : "Entregue"}
                          aria-hidden
                        >
                          {m.read_at ? (
                            <span className="text-green-light">✓✓</span>
                          ) : (
                            <span className="text-white/55">✓✓</span>
                          )}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() =>
                          setReplyTarget({ id: m.id, body: m.body, sender_id: m.sender_id })
                        }
                        className={`shrink-0 rounded-md p-1 transition ${
                          mine
                            ? "text-white/80 hover:bg-white/15 hover:text-white"
                            : "text-text-muted hover:bg-white/5 hover:text-gold"
                        }`}
                        aria-label="Responder"
                        title="Responder"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M9 14 4 9l5-5" strokeLinecap="round" strokeLinejoin="round" />
                          <path
                            d="M20 20v-7a4 4 0 0 0-4-4H4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="border-t border-border">
          {replyTarget && activeThread ? (
            <div className="flex items-stretch gap-2 bg-bg-secondary/60 px-3 py-3 sm:px-5">
              <div className="min-w-0 flex-1 border-l-[3px] border-gold pl-3">
                <p className="text-[11px] font-semibold text-gold">
                  {replyBarTitle(replyTarget.sender_id, myId, activeThread.counterpart.name)}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">{replyTarget.body}</p>
              </div>
              <button
                type="button"
                onClick={() => setReplyTarget(null)}
                className="shrink-0 self-center rounded-lg p-2 text-text-muted transition hover:bg-white/5 hover:text-text-primary"
                aria-label="Cancelar resposta"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ) : null}
          <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-end sm:gap-3 sm:p-5">
            <textarea
              ref={taRef}
              value={text}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Mensagem… (Ctrl+Enter para enviar)"
              rows={1}
              disabled={!activeThreadId}
              className="scrollbar-none min-h-[48px] w-full resize-none overflow-y-auto rounded-2xl border border-border bg-bg-secondary px-4 py-3 text-base leading-snug text-text-primary outline-none placeholder:text-text-muted sm:min-h-[44px] sm:rounded-3xl sm:px-5"
            />
            <Button
              variant="green"
              className="min-h-[48px] w-full shrink-0 rounded-2xl px-6 sm:w-auto sm:rounded-full"
              onClick={() => void send()}
              disabled={!activeThreadId}
            >
              Enviar
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
