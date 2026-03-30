import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "gold" | "green" | "outline";

const variants: Record<Variant, string> = {
  gold: "bg-gold text-bg-primary hover:bg-gradient-to-br hover:from-gold-light hover:to-gold border-transparent",
  green: "bg-green-main text-white hover:bg-green-light border-transparent",
  outline:
    "bg-transparent border-border text-text-primary hover:border-gold hover:text-gold",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
  className?: string;
};

export function Button({
  variant = "gold",
  className = "",
  children,
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-lg border px-6 py-2.5 text-[15px] font-medium transition-all duration-300 hover:-translate-y-0.5 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
