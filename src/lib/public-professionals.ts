import { tryCreateClient } from "@/lib/supabase/server";
import type { PublicCategory, PublicProfessional } from "@/lib/public-professionals-shared";

type ServiceCategory = { name?: string | null; slug?: string | null } | null;
type ServiceRow = {
  user_id: string;
  title: string | null;
  categories: ServiceCategory | ServiceCategory[];
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  city: string | null;
  headline: string | null;
};

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "P";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function hashText(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function fakeStars(seed: string) {
  return (hashText(seed) % 2) + 4; // 4..5
}

function fakeReviews(seed: string) {
  return (hashText(seed) % 49) + 8; // 8..56
}

function colorFromSeed(seed: string) {
  const palette = ["#2E7D52", "#7B4EA6", "#C9A84C", "#1E6E8C", "#8C5E1E", "#C04848"];
  return palette[hashText(seed) % palette.length]!;
}

export function professionalSlug(name: string, id: string) {
  return `${slugify(name || "prestador")}-${id}`;
}

export function professionalIdFromSlug(slug: string): string | null {
  const m = slug.match(/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i);
  return m?.[1] ?? null;
}

function normalizeServiceCategories(input: ServiceCategory | ServiceCategory[]): ServiceCategory[] {
  if (Array.isArray(input)) return input;
  return input ? [input] : [];
}

function toPublicProfessional(profile: ProfileRow, services: ServiceRow[]): PublicProfessional {
  const name = profile.full_name?.trim() || "Prestador Linkora";
  const categories = services
    .flatMap((s) => normalizeServiceCategories(s.categories))
    .map((c) => ({ name: c?.name?.trim(), slug: c?.slug?.trim() }))
    .filter((c) => Boolean(c.name && c.slug));

  const uniqueCategorySlugs = Array.from(new Set(categories.map((c) => c.slug as string)));
  const specialty = categories[0]?.name || profile.headline?.trim() || "Sem especialidade definida";
  const seed = `${profile.id}:${name}`;

  return {
    id: profile.id,
    slug: professionalSlug(name, profile.id),
    name,
    city: profile.city?.trim() || "Cidade não informada",
    specialty,
    categorySlugs: uniqueCategorySlugs,
    initials: initialsFromName(name),
    color: colorFromSeed(seed),
    stars: fakeStars(seed),
    reviews: fakeReviews(seed),
  };
}

export async function getPublicProfessionalsAndCategories() {
  const supabase = await tryCreateClient();
  if (!supabase) {
    return { categories: [] as PublicCategory[], professionals: [] as PublicProfessional[] };
  }

  const [{ data: categoriesRows }, { data: profilesRows }, { data: servicesRows }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").eq("is_active", true).order("name", { ascending: true }),
    supabase.from("profiles").select("id, full_name, city, headline").eq("role", "provider"),
    supabase
      .from("provider_services")
      .select("user_id, title, categories(name, slug)")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const categories: PublicCategory[] = (categoriesRows ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    slug: c.slug as string,
  }));

  const servicesByUser = new Map<string, ServiceRow[]>();
  for (const row of (servicesRows ?? []) as ServiceRow[]) {
    const list = servicesByUser.get(row.user_id) ?? [];
    list.push(row);
    servicesByUser.set(row.user_id, list);
  }

  const professionals = ((profilesRows ?? []) as ProfileRow[])
    .map((p) => toPublicProfessional(p, servicesByUser.get(p.id) ?? []))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return { categories, professionals };
}

export async function getPublicProfessionalById(id: string) {
  const supabase = await tryCreateClient();
  if (!supabase) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, city, headline, role")
    .eq("id", id)
    .eq("role", "provider")
    .maybeSingle();

  if (!profile) return null;

  const { data: servicesRows } = await supabase
    .from("provider_services")
    .select("user_id, title, categories(name, slug)")
    .eq("user_id", id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return toPublicProfessional(
    {
      id: profile.id as string,
      full_name: profile.full_name as string | null,
      city: profile.city as string | null,
      headline: profile.headline as string | null,
    },
    (servicesRows ?? []) as ServiceRow[],
  );
}

export async function getPublicProfessionalBySlug(slug: string) {
  const { professionals } = await getPublicProfessionalsAndCategories();
  return professionals.find((p) => p.slug === slug) ?? null;
}
