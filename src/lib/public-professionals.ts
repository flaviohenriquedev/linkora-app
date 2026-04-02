import { formatCentsToBrl } from "@/lib/currency";
import { getSignedUrlForPublicProviderAvatar } from "@/lib/public-files";
import { tryCreateClient } from "@/lib/supabase/server";
import type {
  PublicCategory,
  PublicProviderContact,
  PublicProfessional,
  PublicProfessionalDetail,
  PublicServiceRow,
} from "@/lib/public-professionals-shared";

type ServiceCategory = { name?: string | null; slug?: string | null } | null;
type ServiceRow = {
  id?: string;
  user_id: string;
  title: string | null;
  description?: string | null;
  price_cents?: number | null;
  categories: ServiceCategory | ServiceCategory[] | { name: string; slug: string } | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  city: string | null;
  headline: string | null;
  bio: string | null;
  avatar_file_id: string | null;
};

type ProviderContactRow = {
  id: string;
  type: "email" | "phone" | "whatsapp";
  label: string | null;
  value: string;
  sort_order: number;
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
  return (hashText(seed) % 2) + 4;
}

function fakeReviews(seed: string) {
  return (hashText(seed) % 49) + 8;
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

function priceLabelFromServices(services: ServiceRow[]): string | null {
  const cents = services
    .map((s) => s.price_cents)
    .filter((c): c is number => c != null && Number.isFinite(c) && c >= 0);
  if (!cents.length) return null;
  const min = Math.min(...cents);
  return `A partir de R$ ${formatCentsToBrl(min)}`;
}

function toPublicProfessional(profile: ProfileRow, services: ServiceRow[]): PublicProfessional {
  const name = profile.full_name?.trim() || "Prestador Linkora";
  const categories = services
    .flatMap((s) => normalizeServiceCategories(s.categories as ServiceCategory | ServiceCategory[]))
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
    avatarUrl: null,
    stars: fakeStars(seed),
    reviews: fakeReviews(seed),
    priceLabel: priceLabelFromServices(services),
  };
}

function mapToPublicServiceRow(row: ServiceRow): PublicServiceRow {
  const catRaw = row.categories;
  const cat =
    catRaw && !Array.isArray(catRaw) && typeof catRaw === "object" && "name" in catRaw && "slug" in catRaw
      ? { name: String((catRaw as { name: string }).name), slug: String((catRaw as { slug: string }).slug) }
      : null;

  return {
    id: row.id ?? "",
    title: row.title?.trim() || "Serviço",
    description: row.description ?? null,
    price_cents: row.price_cents ?? null,
    category: cat,
  };
}

export async function getPublicProfessionalsAndCategories() {
  const supabase = await tryCreateClient();
  if (!supabase) {
    return { categories: [] as PublicCategory[], professionals: [] as PublicProfessional[] };
  }

  const [{ data: categoriesRows }, { data: profilesRows }, { data: servicesRows }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").eq("is_active", true).order("name", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, full_name, city, headline, bio, avatar_file_id")
      .eq("role", "provider")
      .eq("is_active", true),
    supabase
      .from("provider_services")
      .select("id, user_id, title, description, price_cents, categories(name, slug)")
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

  const profileRows = (profilesRows ?? []) as ProfileRow[];
  const professionals = (
    await Promise.all(
      profileRows.map(async (p) => {
        const base = toPublicProfessional(p, servicesByUser.get(p.id) ?? []);
        const avatarUrl = await getSignedUrlForPublicProviderAvatar(p.avatar_file_id);
        return { ...base, avatarUrl };
      }),
    )
  ).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return { categories, professionals };
}

export async function getPublicProfessionalById(id: string): Promise<PublicProfessionalDetail | null> {
  const supabase = await tryCreateClient();
  if (!supabase) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, city, headline, bio, role, avatar_file_id")
    .eq("id", id)
    .eq("role", "provider")
    .eq("is_active", true)
    .maybeSingle();

  if (!profile) return null;

  const { data: contactsRows } = await supabase
    .from("provider_contacts")
    .select("id, type, label, value, sort_order")
    .eq("provider_id", id)
    .eq("is_public", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const { data: servicesRows } = await supabase
    .from("provider_services")
    .select("id, user_id, title, description, price_cents, categories(name, slug)")
    .eq("user_id", id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const raw = (servicesRows ?? []) as ServiceRow[];
  const base = toPublicProfessional(
    {
      id: profile.id as string,
      full_name: profile.full_name as string | null,
      city: profile.city as string | null,
      headline: profile.headline as string | null,
      bio: (profile.bio as string | null) ?? null,
      avatar_file_id: (profile.avatar_file_id as string | null) ?? null,
    },
    raw,
  );

  const avatarUrl = await getSignedUrlForPublicProviderAvatar(profile.avatar_file_id as string | null);

  const contacts: PublicProviderContact[] = ((contactsRows ?? []) as ProviderContactRow[]).map((c) => ({
    id: c.id,
    type: c.type,
    label: c.label,
    value: c.value,
  }));

  const services: PublicServiceRow[] = raw.map(mapToPublicServiceRow);

  return { ...base, avatarUrl, bio: (profile.bio as string | null) ?? null, contacts, services };
}

export async function getPublicProfessionalBySlug(slug: string) {
  const { professionals } = await getPublicProfessionalsAndCategories();
  return professionals.find((p) => p.slug === slug) ?? null;
}

export async function getPublicProfessionalDetailBySlug(slug: string): Promise<PublicProfessionalDetail | null> {
  const id = professionalIdFromSlug(slug);
  if (!id) return null;
  return getPublicProfessionalById(id);
}
