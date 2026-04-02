import type { ReactNode } from "react";
import { AuthMobileTopBar } from "@/components/login/AuthMobileTopBar";
import { LoginBrandPanel } from "@/components/login/LoginBrandPanel";

type Props = { children: ReactNode };

/**
 * Layout em duas colunas: marca (fixa na altura da viewport em lg+) e formulário
 * com scroll independente quando o conteúdo ultrapassa a tela.
 */
export function AuthSplitPage({ children }: Props) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg-primary lg:h-[100svh] lg:max-h-[100svh] lg:min-h-0 lg:flex-row lg:overflow-hidden">
      {/* Coluna da marca só em telas grandes; no mobile fica só o formulário */}
      <div className="relative hidden min-h-0 shrink-0 flex-col lg:flex lg:h-full lg:min-h-0 lg:flex-1 lg:basis-0 lg:overflow-hidden">
        <LoginBrandPanel />
      </div>
      {/* Sem flex-col aqui: evita flex-shrink no filho e esconder parte do formulário */}
      <div className="min-h-0 flex-1 basis-0 overflow-x-hidden overflow-y-auto overscroll-y-contain lg:relative lg:z-10 lg:max-h-full lg:border-l lg:border-white/10 lg:bg-bg-primary/75 lg:shadow-[-14px_0_28px_rgba(0,0,0,0.22)] lg:[scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]">
        <AuthMobileTopBar />
        {children}
      </div>
    </div>
  );
}
