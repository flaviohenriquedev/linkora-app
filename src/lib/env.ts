/** URL + chave anônima; null se faltar algo (middleware e rotas podem degradar sem crash opaco). */
export function getSupabasePublicEnv(): { url: string; anon: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return { url, anon };
}

export function getSupabaseUrl(): string {
  const env = getSupabasePublicEnv();
  if (!env) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  return env.url;
}

export function getSupabaseAnonKey(): string {
  const env = getSupabasePublicEnv();
  if (!env) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    );
  }
  return env.anon;
}
