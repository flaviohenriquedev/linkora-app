import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Inline (sem importar @/lib/env) para o bundle do Edge Middleware não quebrar. */
function getSupabaseEdgeEnv(): { url: string; anon: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return { url, anon };
}

/**
 * Next.js 15: cookies da Request no middleware são somente leitura — não chame
 * request.cookies.set (pode lançar e gerar 500 em todas as rotas). Só use
 * response.cookies.set, como na doc do Supabase SSR.
 */
export async function getSupabaseSessionUser(request: NextRequest) {
  const env = getSupabaseEdgeEnv();
  if (!env) {
    return {
      response: NextResponse.next({ request }),
      user: null as null,
    };
  }

  const response = NextResponse.next({
    request,
  });

  try {
    const supabase = createServerClient(env.url, env.anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return { response, user };
  } catch (e) {
    console.error("[supabase middleware]", e);
    return {
      response: NextResponse.next({ request }),
      user: null as null,
    };
  }
}
