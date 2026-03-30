import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/env";

export function createClient() {
  const env = getSupabasePublicEnv();
  if (!env) {
    throw new Error(
      "Supabase não configurado: crie .env.local com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY e reinicie o servidor de desenvolvimento.",
    );
  }
  return createBrowserClient(env.url, env.anon);
}
