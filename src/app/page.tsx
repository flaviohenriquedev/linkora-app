import { Suspense } from "react";
import { BlogPreview } from "@/components/home/BlogPreview";
import { CtaKa } from "@/components/home/CtaKa";
import { ExploreCategories } from "@/components/home/ExploreCategories";
import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorks } from "@/components/home/HowItWorks";

/** Home lê categorias do banco; sem isso o build pode cachear HTML sem categorias novas. */
export const dynamic = "force-dynamic";

function ExploreCategoriesFallback() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto mb-8 h-8 max-w-md animate-pulse rounded bg-bg-card sm:mb-12" />
      <div className="-mx-4 flex gap-2 overflow-hidden px-4 sm:-mx-6 sm:px-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-11 min-w-[88px] shrink-0 animate-pulse rounded-full bg-bg-card"
          />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-[calc(100dvh-4rem)] animate-fade-in sm:min-h-[calc(100dvh-4.5rem)]">
      <HeroSection />
      <Suspense fallback={<ExploreCategoriesFallback />}>
        <ExploreCategories />
      </Suspense>
      <HowItWorks />
      <CtaKa />
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 sm:px-6 sm:pb-24">
            <div className="mx-auto mb-8 h-8 max-w-xs animate-pulse rounded bg-bg-card sm:mb-12" />
            <div className="grid gap-5 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-bg-card" />
              ))}
            </div>
          </div>
        }
      >
        <BlogPreview />
      </Suspense>
    </main>
  );
}
