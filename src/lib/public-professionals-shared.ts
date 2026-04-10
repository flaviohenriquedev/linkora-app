import type { PortfolioCropAspect } from "@/lib/portfolio-crop-aspect";

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
  /** Foto do perfil (Storage); null se não houver ou URL não puder ser gerada */
  avatarUrl: string | null;
  stars: number;
  reviews: number;
  /** Ex.: "A partir de R$ 120,00" quando há preço em algum serviço */
  priceLabel: string | null;
  /** Preenchido no cliente quando o utilizador está autenticado (API de presença) */
  presence?: "online" | "away" | "offline";
  /** Primeiro contato WhatsApp público (dígitos com DDI), para link wa.me */
  whatsappPhoneDigits: string | null;
  /** Mensagem opcional no perfil para pré-preencher o WhatsApp */
  whatsappOpenMessage: string | null;
};

export type PublicServiceRow = {
  id: string;
  title: string;
  description: string | null;
  price_cents: number | null;
  category: { name: string; slug: string } | null;
};

export type PublicProviderContact = {
  id: string;
  type: "email" | "phone" | "whatsapp";
  label: string | null;
  value: string;
};

export type PublicPortfolioPost = {
  id: string;
  imageUrl: string | null;
  caption: string | null;
  created_at: string;
  /** Proporção escolhida no recorte (1:1, 3:4 ou 9:16). */
  crop_aspect: PortfolioCropAspect;
};

export type PublicProfessionalDetail = PublicProfessional & {
  bio: string | null;
  contacts: PublicProviderContact[];
  services: PublicServiceRow[];
  portfolioPosts: PublicPortfolioPost[];
};

export function professionalPath(p: Pick<PublicProfessional, "slug">) {
  return `/professionals/${p.slug}`;
}
