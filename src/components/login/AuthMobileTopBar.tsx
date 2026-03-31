import Link from "next/link";
import { LogoLinkora } from "@/components/brand/LogoLinkora";

/** Faixa fina só abaixo do breakpoint lg: logo + atalho para o início (safe-area no topo). */
export function AuthMobileTopBar() {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border/70 bg-bg-primary/90 px-5 pb-3 pt-[max(0.625rem,env(safe-area-inset-top))] backdrop-blur-md lg:hidden">
      <Link
        href="/"
        className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2.5 font-serif text-[0.95rem] font-semibold tracking-[0.14em] text-text-primary transition-opacity hover:opacity-90"
      >
        <LogoLinkora className="h-8 w-8 shrink-0 text-gold" />
        <span className="truncate">LINKORA</span>
      </Link>
      <Link
        href="/"
        className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg px-2 py-2 text-[14px] font-medium text-text-secondary transition-colors hover:text-gold"
      >
        ← Início
      </Link>
    </div>
  );
}
