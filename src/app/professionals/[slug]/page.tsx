import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicProfessionalProfile } from "@/components/profile/PublicProfessionalProfile";
import {
  getPublicProfessionalBySlug,
} from "@/lib/public-professionals";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const professional = await getPublicProfessionalBySlug(slug);
  if (!professional) return { title: "Profissional — LINKORA" };
  return {
    title: `${professional.name} — LINKORA`,
    description: `${professional.specialty} em ${professional.city}`,
  };
}

export default async function ProfessionalPublicPage({ params }: Props) {
  const { slug } = await params;
  const professional = await getPublicProfessionalBySlug(slug);
  if (!professional) notFound();

  return (
    <main className="min-h-[calc(100vh-72px)]">
      <PublicProfessionalProfile professional={professional} />
    </main>
  );
}
