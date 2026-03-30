import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "@/lib/env";

export async function createClient() {
  const env = getSupabasePublicEnv();
  if (!env) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY) no ambiente — em produção, nas variáveis do Vercel, e faça um novo deploy.",
    );
  }

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
}
