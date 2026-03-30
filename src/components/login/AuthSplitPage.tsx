import type { ReactNode } from "react";
import { LoginBrandPanel } from "@/components/login/LoginBrandPanel";

type Props = { children: ReactNode };

/** Layout em duas colunas (marca + formulário) usado em login e cadastro. */
export function AuthSplitPage({ children }: Props) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg-primary lg:min-h-screen lg:flex-row">
      <LoginBrandPanel />
      {children}
    </div>
  );
}
