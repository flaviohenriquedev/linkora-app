"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";

const nav = [
  { href: "/", label: "Início" },
  { href: "/professionals", label: "Profissionais" },
  { href: "/blog", label: "Cursos / Blog" },
  { href: "/ka", label: "IA Ka" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, closeMenu]);

  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <header className="sticky top-0 z-[100] border-b border-border bg-[rgba(13,31,23,0.92)] pt-[env(safe-area-inset-top)] backdrop-blur-[12px]">
      <Container className="flex min-h-[56px] items-center justify-between gap-3 py-2 sm:min-h-[64px] sm:py-0 md:min-h-[72px]">
        <Link
          href="/"
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center gap-2 font-serif text-lg font-semibold tracking-[0.12em] sm:gap-3 sm:text-xl md:text-2xl md:tracking-[2px]"
        >
          <Logo className="h-9 w-9 sm:h-10 sm:w-10" />
          <span className="leading-none">LINKORA</span>
        </Link>

        <nav className="hidden lg:block" aria-label="Principal">
          <ul className="flex gap-6 xl:gap-8">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`inline-flex min-h-[44px] items-center whitespace-nowrap text-[15px] transition-colors duration-300 ${
                    isActive(pathname, item.href)
                      ? "text-gold"
                      : "text-text-secondary hover:text-gold"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 lg:flex xl:gap-4">
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center whitespace-nowrap px-2 text-[15px] text-text-secondary transition-colors hover:text-gold"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="inline-flex min-h-[44px] items-center whitespace-nowrap px-2 text-[15px] text-text-secondary transition-colors hover:text-gold"
          >
            Cadastrar
          </Link>
          <Link
            href="/user-profile"
            className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap text-[15px] text-gold"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-light text-[10px] font-bold text-bg-primary">
              U
            </span>
            Meu Perfil
          </Link>
          <Link href="/professionals">
            <span className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-transparent bg-gold px-6 py-2.5 text-[15px] font-medium text-bg-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-gold-light hover:to-gold">
              Encontrar Profissional →
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <Link
            href="/login"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-2 text-[15px] text-text-secondary transition-colors hover:text-gold"
          >
            Entrar
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-primary hover:bg-white/5"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label="Abrir menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </Container>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[200] bg-black/55 backdrop-blur-sm lg:hidden"
            aria-label="Fechar menu"
            onClick={closeMenu}
          />
          <div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            className="fixed inset-y-0 right-0 z-[201] flex w-[min(100%,20rem)] flex-col border-l border-border bg-bg-primary pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-2xl lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="font-serif text-lg text-text-primary">Menu</span>
              <button
                type="button"
                onClick={closeMenu}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-secondary hover:bg-white/5 hover:text-gold"
                aria-label="Fechar menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4" aria-label="Principal">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className={`rounded-xl px-4 py-3.5 text-base transition-colors ${
                    isActive(pathname, item.href)
                      ? "bg-gold/10 font-medium text-gold"
                      : "text-text-secondary hover:bg-white/5 hover:text-gold"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-3 border-t border-border" />
              <Link
                href="/register"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3.5 text-base text-text-secondary hover:bg-white/5 hover:text-gold"
              >
                Cadastrar
              </Link>
              <Link
                href="/user-profile"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-base text-gold hover:bg-white/5"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-light text-[10px] font-bold text-bg-primary">
                  U
                </span>
                Meu Perfil
              </Link>
              <Link
                href="/professionals"
                onClick={closeMenu}
                className="mt-2 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-gold px-4 py-3 text-center font-medium text-bg-primary"
              >
                Encontrar Profissional →
              </Link>
            </nav>
          </div>
        </>
      ) : null}
    </header>
  );
}
