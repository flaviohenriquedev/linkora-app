import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { FloatingBubbles } from "@/components/login/FloatingBubbles";

export function LoginBrandPanel() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col justify-between overflow-hidden bg-bg-primary px-4 py-10 text-text-primary sm:min-h-[min(100dvh,720px)] sm:px-8 sm:py-12 md:p-14 lg:h-full lg:max-h-full lg:min-h-0 lg:rounded-none">
      <FloatingBubbles />
      <div className="relative z-10 flex flex-1 flex-col justify-center">
        <Link
          href="/"
          className="mb-8 inline-flex min-h-[44px] w-fit items-center gap-2 font-serif text-lg font-semibold tracking-[0.15em] text-text-primary/90 transition-opacity hover:opacity-90 sm:mb-10 sm:gap-3 sm:text-xl sm:tracking-[0.2em] md:text-2xl"
        >
          <Logo className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
          LINKORA
        </Link>
        <h1 className="max-w-md font-serif text-[1.65rem] font-medium leading-[1.15] tracking-tight text-text-primary sm:text-4xl md:text-5xl lg:text-[3.25rem]">
          O ecossistema para quem{" "}
          <span className="bg-gradient-to-r from-gold-light via-gold to-gold-light bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer">
            confecciona moda
          </span>
          .
        </h1>
        <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-text-secondary sm:mt-6 sm:text-base md:text-lg">
          Conecte-se a profissionais, fornecedores e inspiração — com a elegância que o seu negócio merece.
        </p>
        <div className="mt-8 flex flex-wrap gap-2 sm:mt-10 sm:gap-3">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-gold-light/90 backdrop-blur-sm sm:px-4 sm:text-xs">
            Moda · Produção · Rede
          </span>
          <span className="rounded-full border border-gold/20 bg-gold/5 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-text-secondary backdrop-blur-sm sm:px-4 sm:text-xs">
            Ecossistema ativo
          </span>
        </div>
      </div>
      <p className="relative z-10 pb-[env(safe-area-inset-bottom)] text-xs text-text-muted sm:text-sm">
        © {new Date().getFullYear()} Linkora. Todos os direitos reservados.
      </p>
    </div>
  );
}
