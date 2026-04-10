/** Valores em `provider_portfolio_posts.crop_aspect` (e no JSON da API). */
export const PORTFOLIO_CROP_ASPECT_VALUES = ["1_1", "3_4", "9_16"] as const;
export type PortfolioCropAspect = (typeof PORTFOLIO_CROP_ASPECT_VALUES)[number];

export type PortfolioCropAspectOption = {
  id: string;
  label: string;
  /** Largura ÷ altura (react-easy-crop). */
  aspect: number;
  cropKey: PortfolioCropAspect;
};

export const PORTFOLIO_CROP_ASPECT_OPTIONS: readonly PortfolioCropAspectOption[] = [
  { id: "1-1", label: "1:1", aspect: 1, cropKey: "1_1" },
  { id: "3-4", label: "3:4", aspect: 3 / 4, cropKey: "3_4" },
  { id: "9-16", label: "9:16", aspect: 9 / 16, cropKey: "9_16" },
] as const;

export function parsePortfolioCropAspect(v: unknown): PortfolioCropAspect {
  return PORTFOLIO_CROP_ASPECT_VALUES.includes(v as PortfolioCropAspect)
    ? (v as PortfolioCropAspect)
    : "1_1";
}

/** Classes Tailwind para o contentor da imagem (largura cheia). */
export function portfolioCropAspectClass(crop: PortfolioCropAspect | string | null | undefined): string {
  if (crop === "3_4") return "aspect-[3/4]";
  if (crop === "9_16") return "aspect-[9/16]";
  return "aspect-square";
}
