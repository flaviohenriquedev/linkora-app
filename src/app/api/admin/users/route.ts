import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth/admin";
import { tryCreateClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { isAdmin } = await isCurrentUserAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const supabase = await tryCreateClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase indisponível" }, { status: 503 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "10", 10) || 10));
  const search = url.searchParams.get("q")?.trim() || null;
  const role = url.searchParams.get("role")?.trim() || "all";

  const { data, error } = await supabase.rpc("admin_list_users_paginated", {
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
    p_search: search,
    p_role: role,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    created_at: string;
    total_count: number;
  }[];

  const total = rows[0]?.total_count ?? 0;

  const users = rows.map(({ total_count: _tc, ...u }) => u);

  return NextResponse.json({
    users,
    page,
    pageSize,
    total: Number(total),
    totalPages: Math.max(1, Math.ceil(Number(total) / pageSize)),
  });
}
