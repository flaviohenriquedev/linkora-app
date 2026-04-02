import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar — Linkora",
  description: "Acesse sua conta Linkora.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
