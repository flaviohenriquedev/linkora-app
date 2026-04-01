export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
};

export type PublicProfessional = {
  id: string;
  slug: string;
  name: string;
  city: string;
  specialty: string;
  categorySlugs: string[];
  initials: string;
  color: string;
  stars: number;
  reviews: number;
  /** Ex.: "A partir de R$ 120,00" quando há preço em algum serviço */
  priceLabel: string | null;
};

export type PublicServiceRow = {
  id: string;
  title: string;
  description: string | null;
  price_cents: number | null;
  category: { name: string; slug: string } | null;
};

export type PublicProfessionalDetail = PublicProfessional & {
  services: PublicServiceRow[];
};

export function professionalPath(p: Pick<PublicProfessional, "slug">) {
  return `/professionals/${p.slug}`;
}
