import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "@/lib/env";

/**
 * Cliente Supabase para Server Components / Route Handlers.
 * Retorna `null` se variáveis públicas não estiverem definidas ou se `cookies()` falhar no contexto atual.
 */
export async function tryCreateClient(): Promise<SupabaseClient | null> {
  const env = getSupabasePublicEnv();
  if (!env) return null;
  try {
    const cookieStore = await cookies();
    return createServerClient(env.url, env.anon, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* set from Server Component — ignorar */
          }
        },
      },
    });
  } catch {
    return null;
  }
}

export async function createClient(): Promise<SupabaseClient> {
  const client = await tryCreateClient();
  if (!client) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY) no ambiente — em produção, nas variáveis do Vercel, e faça um novo deploy.",
    );
  }
  return client;
}
