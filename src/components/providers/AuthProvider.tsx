"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export type UserRole = "owner" | "provider";

export type ProfileRow = {
  id: string;
  role: UserRole;
  full_name: string;
  headline: string | null;
  bio: string | null;
  city: string | null;
  avatar_file_id: string | null;
  created_at: string;
  updated_at: string;
  /** Conta desativada: sessão é encerrada no cliente */
  is_active?: boolean;
};

type AuthContextValue = {
  user: User | null;
  profile: ProfileRow | null;
  email: string | null;
  avatarUrl: string | null;
  /** Presente na tabela `admin_users` — acesso ao painel /admin */
  isAdmin: boolean;
  /** Sessão resolvida (getUser); false = ainda verificando. Visitantes veem Login cedo. */
  loading: boolean;
  /** Perfil /api/profile ainda carregando (usuário já logado) */
  profileLoading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const refresh = useCallback(async () => {
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch (e) {
      console.error("[auth] Supabase não configurado no cliente", e);
      setUser(null);
      setProfile(null);
      setEmail(null);
      setAvatarUrl(null);
      setIsAdmin(false);
      setProfileLoading(false);
      setLoading(false);
      return;
    }

    const {
      data: { user: nextUser },
    } = await supabase.auth.getUser();

    setUser(nextUser);
    setEmail(nextUser?.email ?? null);

    if (!nextUser) {
      setProfile(null);
      setAvatarUrl(null);
      setIsAdmin(false);
      setProfileLoading(false);
      setLoading(false);
      return;
    }

    setLoading(false);
    setProfileLoading(true);

    const res = await fetch("/api/profile", { method: "GET", cache: "no-store" });
    if (!res.ok) {
      setProfile(null);
      setAvatarUrl(null);
      setIsAdmin(false);
      setProfileLoading(false);
      return;
    }

    const json = (await res.json()) as {
      profile: ProfileRow | null;
      avatarUrl: string | null;
      email: string | null;
      isAdmin?: boolean;
    };
    const p = json.profile;
    if (p && (p.role === "owner" || p.role === "provider")) {
      if (p.is_active === false) {
        try {
          const supabase = createClient();
          await supabase.auth.signOut();
          await fetch("/api/auth/sign-out", { method: "POST" });
        } catch {
          /* noop */
        }
        setUser(null);
        setProfile(null);
        setEmail(null);
        setAvatarUrl(null);
        setIsAdmin(false);
        setProfileLoading(false);
        router.replace("/login?inactive=1");
        return;
      }
      setProfile({ ...p });
    } else {
      setProfile(null);
    }
    // Evita piscar para "sem avatar" quando signed URL expira e API ainda não respondeu novo link.
    setAvatarUrl((prev) => json.avatarUrl ?? prev);
    if (json.email) setEmail(json.email);
    setIsAdmin(Boolean(json.isAdmin));
    setProfileLoading(false);
  }, [router]);

  useEffect(() => {
    void refresh();

    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });

    return () => subscription.unsubscribe();
  }, [refresh]);

  const signOut = useCallback(async () => {
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      setUser(null);
      setProfile(null);
      setEmail(null);
      setAvatarUrl(null);
      setIsAdmin(false);
      return;
    }
    setUser(null);
    setProfile(null);
    setEmail(null);
    setAvatarUrl(null);
    setIsAdmin(false);
    setProfileLoading(false);

    // Atualiza presença imediatamente antes do logout (evita "online" ficar preso).
    try {
      void fetch("/api/chat/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "offline" }),
        keepalive: true,
      });
    } catch {
      // noop
    }

    await supabase.auth.signOut();
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
    } catch {
      // noop
    }
    if (typeof window !== "undefined") {
      window.location.assign("/");
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      email,
      avatarUrl,
      isAdmin,
      loading,
      profileLoading,
      refresh,
      signOut,
    }),
    [user, profile, email, avatarUrl, isAdmin, loading, profileLoading, refresh, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
