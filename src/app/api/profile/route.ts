import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { syncOAuthAvatarIfMissing } from "@/lib/auth/syncOAuthAvatar";
import { tryCreateClient } from "@/lib/supabase/server";

async function ensureProfileRow(supabase: SupabaseClient, userId: string) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (existing) return;
  await supabase.from("profiles").insert({ id: userId, role: "owner" });
}

export async function GET() {
  const supabase = await tryCreateClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase indisponível" }, { status: 503 });
  }
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  await ensureProfileRow(supabase, user.id);

  let { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, headline, bio, city, avatar_file_id, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (profile && !profile.avatar_file_id) {
    await syncOAuthAvatarIfMissing(supabase, user);
    const { data: again } = await supabase
      .from("profiles")
      .select("id, role, full_name, headline, bio, city, avatar_file_id, created_at, updated_at")
      .eq("id", user.id)
      .maybeSingle();
    if (again) profile = again;
  }

  const { data: adminRow, error: adminErr } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const isAdmin = !adminErr && Boolean(adminRow);

  let avatarUrl: string | null = null;
  if (profile?.avatar_file_id) {
    const { data: fileRow } = await supabase
      .from("files")
      .select("storage_path, bucket")
      .eq("id", profile.avatar_file_id)
      .maybeSingle();

    if (fileRow?.storage_path) {
      const { data: signed } = await supabase.storage
        .from(fileRow.bucket ?? "linkora-files")
        .createSignedUrl(fileRow.storage_path, 3600);
      avatarUrl = signed?.signedUrl ?? null;
    }
  }

  return NextResponse.json({
    profile: profile ?? null,
    avatarUrl,
    email: user.email,
    isAdmin,
  });
}

export async function PATCH(request: Request) {
  const supabase = await tryCreateClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase indisponível" }, { status: 503 });
  }
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  await ensureProfileRow(supabase, user.id);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (body.avatar_file_id === null) {
    const { data: current } = await supabase
      .from("profiles")
      .select("avatar_file_id")
      .eq("id", user.id)
      .maybeSingle();
    const oldId = current?.avatar_file_id;
    if (oldId) {
      const { data: fileRow } = await supabase
        .from("files")
        .select("bucket, storage_path")
        .eq("id", oldId)
        .maybeSingle();
      const bucket = fileRow?.bucket ?? "linkora-files";
      if (fileRow?.storage_path) {
        await supabase.storage.from(bucket).remove([fileRow.storage_path]);
      }
      await supabase.from("files").delete().eq("id", oldId);
    }
  }

  const patch: Record<string, string | null> = {};
  if (typeof body.full_name === "string") patch.full_name = body.full_name;
  if (typeof body.headline === "string") patch.headline = body.headline;
  if (typeof body.bio === "string") patch.bio = body.bio;
  if (typeof body.city === "string") patch.city = body.city;
  if (body.avatar_file_id === null) patch.avatar_file_id = null;
  if (typeof body.avatar_file_id === "string") patch.avatar_file_id = body.avatar_file_id;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nenhum campo válido" }, { status: 400 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, ...patch }, { onConflict: "id" })
    .select("id, role, full_name, headline, bio, city, avatar_file_id, created_at, updated_at")
    .maybeSingle();

  if (error || !profile) {
    return NextResponse.json(
      { error: error?.message ?? "Não foi possível salvar o perfil" },
      { status: 500 },
    );
  }

  return NextResponse.json({ profile });
}
