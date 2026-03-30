import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Largura máxima + padding horizontal mobile-first (base = telefone). */
export function Container({ children, className = "" }: Props) {
  return (
    <div className={`mx-auto w-full max-w-[1200px] px-4 sm:px-6 ${className}`}>{children}</div>
  );
}
