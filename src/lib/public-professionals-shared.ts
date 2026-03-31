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
};

export function professionalPath(p: Pick<PublicProfessional, "slug">) {
  return `/professionals/${p.slug}`;
}
