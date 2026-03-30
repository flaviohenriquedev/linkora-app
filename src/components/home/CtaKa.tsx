import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { KaAvatar } from "@/components/ka/KaAvatar";

export function CtaKa() {
  return (
    <Container className="pb-14 sm:pb-20">
      <div className="flex flex-col items-center justify-between gap-8 rounded-3xl border border-gold bg-bg-secondary p-6 sm:gap-10 sm:p-10 md:flex-row md:p-12">
        <div className="max-w-[500px]">
          <h2 className="mb-4 font-serif text-2xl text-gold-light md:text-[32px]">
            Fale com a Ka
          </h2>
          <p className="mb-6 text-lg text-text-secondary">
            Ka é sua assistente especialista em confecção de moda. Tire dúvidas técnicas, peça
            dicas de precificação ou sugestões de tecidos e tendências.
          </p>
          <Link href="/ka">
            <Button variant="green">Conversar com a Ka →</Button>
          </Link>
        </div>
        <div className="h-40 w-40 shrink-0 md:h-[160px] md:w-[160px]">
          <KaAvatar />
        </div>
      </div>
    </Container>
  );
}
