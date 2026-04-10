"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";

type NotifItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

function typeLabel(type: string) {
  if (type === "chat_message") return "Mensagem";
  return type;
}

function timeAgo(iso: string) {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "agora";
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} h`;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

type Props = {
  /** Quando o menu hambúrguer abre, o painel de notificações fecha (evita sobreposição). */
  mobileNavOpen?: boolean;
  /** Chamado ao abrir o painel — use para fechar o menu mobile (hambúrguer). */
  onPanelOpen?: () => void;
};

export function NotificationBell({ mobileNavOpen = false, onPanelOpen }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const json = (await res.json()) as { items?: NotifItem[]; unreadCount?: number; error?: string };
      if (!res.ok) return;
      setItems(json.items ?? []);
      setUnreadCount(json.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`in-app-notif-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "in_app_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void fetchNotifications();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [user?.id, fetchNotifications]);

  useEffect(() => {
    const id = setInterval(() => {
      if (user && document.visibilityState === "visible") void fetchNotifications();
    }, 45000);
    return () => clearInterval(id);
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!window.matchMedia("(min-width: 768px)").matches) return;
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (mobileNavOpen) setOpen(false);
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!open) return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function markRead(ids: string[]) {
    if (!ids.length) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    void fetchNotifications();
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    void fetchNotifications();
  }

  if (!user) return null;

  const renderPanel = () => (
    <div
      className="flex min-h-0 flex-1 flex-col bg-bg-card md:max-h-[min(70vh,420px)] md:rounded-xl md:border md:border-border md:shadow-2xl"
      role="menu"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-3 md:py-2.5">
        <span className="text-sm font-medium text-text-primary">Notificações</span>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="min-h-[40px] shrink-0 rounded-lg px-2 text-left text-xs text-gold hover:bg-white/5 hover:underline sm:min-h-0"
          >
            Marcar todas como lidas
          </button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] md:max-h-[min(70vh,380px)]">
        {loading && items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-text-muted">Carregando…</p>
        ) : null}
        {!loading && items.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-text-muted">Sem notificações.</p>
        ) : null}
        {items.map((n) => {
          const href = n.link?.startsWith("/") ? n.link : n.link ? `/${n.link}` : "/chat";
          const unread = !n.read_at;
          return (
            <div key={n.id} className="border-b border-border last:border-b-0">
              <Link
                href={href}
                role="menuitem"
                onClick={async (e) => {
                  e.preventDefault();
                  setOpen(false);
                  if (unread) await markRead([n.id]);
                  router.push(href);
                }}
                className={`block min-h-[52px] px-3 py-3.5 text-left transition hover:bg-bg-primary active:bg-bg-primary md:min-h-0 md:py-3 ${
                  unread ? "bg-gold/[0.06]" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-text-muted">
                    {typeLabel(n.type)}
                  </span>
                  <span className="shrink-0 text-[11px] text-text-muted">{timeAgo(n.created_at)}</span>
                </div>
                <p className="mt-1 break-words text-sm font-medium text-text-primary">{n.title}</p>
                {n.body ? (
                  <p className="mt-0.5 line-clamp-3 break-words text-xs text-text-secondary md:line-clamp-2">
                    {n.body}
                  </p>
                ) : null}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );

  const mobileOverlay =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[1020] flex flex-col md:hidden"
            style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <button
              type="button"
              className="min-h-0 flex-1 bg-black/50 backdrop-blur-[2px]"
              aria-label="Fechar notificações"
              onClick={() => setOpen(false)}
            />
            <div className="mx-3 mb-3 flex max-h-[min(78dvh,560px)] min-h-0 flex-col overflow-hidden rounded-t-2xl rounded-b-xl border border-border bg-bg-card shadow-2xl">
              {renderPanel()}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => {
          if (!open) {
            onPanelOpen?.();
            void fetchNotifications();
          }
          setOpen((o) => !o);
        }}
        className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-white/5 hover:text-gold"
        aria-label="Notificações"
        aria-expanded={open}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-bg-primary">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          {mobileOverlay}
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[150] hidden w-[min(100vw-2rem,360px)] md:block">
            {renderPanel()}
          </div>
        </>
      ) : null}
    </div>
  );
}
