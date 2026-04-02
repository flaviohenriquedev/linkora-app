import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export function HeroSection() {
    return (
        <div className="bg-[radial-gradient(circle_at_center,#152B1F_0%,transparent_70%)] pb-12 pt-12 text-center sm:pb-16 sm:pt-16 md:pt-20">
            <Container>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-bg-card px-3 py-1.5 text-[12px] text-text-secondary sm:mb-6 sm:px-4 sm:text-[13px]">
                    <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-green-light" />
                    Ecossistema ativo
                </div>
                <h1 className="mx-auto mb-5 max-w-[800px] font-serif text-[1.65rem] font-medium leading-[1.2] tracking-tight sm:mb-6 sm:text-4xl md:text-5xl lg:text-[56px]">
                    O ecossistema completo para quem{" "}
                    <em className="not-italic text-gold">confecciona moda</em>
                </h1>
                <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-text-secondary sm:mb-10 sm:text-lg">
                    Encontre estilistas, modelistas, tecidos e muito mais — tudo em um só lugar.
                </p>
                <div className="mx-auto mb-8 flex max-w-[600px] flex-col gap-2 rounded-lg border border-border bg-bg-card p-2 transition-colors focus-within:border-gold sm:mb-10 sm:flex-row sm:items-stretch sm:gap-1.5 sm:p-1.5">
                    <input
                        type="search"
                        placeholder="O que você precisa hoje?"
                        className="min-h-[48px] min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-base text-text-primary outline-none placeholder:text-text-muted sm:min-h-0 sm:px-4 sm:py-2"
                    />
                    <Link href="/professionals" className="shrink-0 sm:self-center">
                        <Button variant="gold" className="min-h-[48px] w-full px-6 sm:min-h-[44px] sm:w-auto">
                            Buscar
                        </Button>
                    </Link>
                </div>
            </Container>
        </div>
    );
}
