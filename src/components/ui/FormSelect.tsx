import type { ReactNode, SelectHTMLAttributes } from "react";

type FormSelectProps = {
  id: string;
  label: string;
  children: ReactNode;
  /** Classes no wrapper externo (label + campo) */
  className?: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "children">;

/**
 * Select nativo estilizado: padding à direita para o texto não colidir com a seta,
 * `appearance-none` e ícone de chevron alinhado a `right-3`.
 */
export function FormSelect({ id, label, children, className = "", ...selectProps }: FormSelectProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-text-muted">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          className="min-h-[44px] w-full cursor-pointer appearance-none rounded-xl border border-border bg-bg-card py-2 pl-3 pr-10 text-sm text-text-primary outline-none focus:border-gold disabled:cursor-not-allowed disabled:opacity-60"
          {...selectProps}
        >
          {children}
        </select>
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
          aria-hidden
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </div>
    </div>
  );
}
