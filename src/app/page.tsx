import { BlogPreview } from "@/components/home/BlogPreview";
import { CtaKa } from "@/components/home/CtaKa";
import { ExploreCategories } from "@/components/home/ExploreCategories";
import { HeroSection } from "@/components/home/HeroSection";
import { HomeProfessionalsGrid } from "@/components/home/HomeProfessionalsGrid";
import { HowItWorks } from "@/components/home/HowItWorks";

export default function HomePage() {
  return (
    <main className="min-h-[calc(100dvh-4rem)] animate-fade-in sm:min-h-[calc(100dvh-4.5rem)]">
      <HeroSection />
      <ExploreCategories />
      <HomeProfessionalsGrid />
      <HowItWorks />
      <CtaKa />
      <BlogPreview />
    </main>
  );
}
