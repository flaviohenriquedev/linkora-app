"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useCallback, useEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {LogoLinkora} from "@/components/brand/LogoLinkora";
import {HeaderContentNav, HeaderContentNavMobile} from "@/components/layout/HeaderContentNav";
import {Container} from "@/components/ui/Container";
import {useAuth} from "@/components/providers/AuthProvider";

const staticNav = [
    {href: "/", label: "Início"},
    {href: "/professionals", label: "Profissionais"},
    {href: "/ka", label: "IA Ka"},
];

function isActive(pathname: string, href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
}

function profileHref(role: string | undefined) {
    return role === "provider" ? "/profile" : "/owner";
}

function activeRoleLabel(role: string | undefined) {
    if (role === "owner") return "Modo Empresário";
    if (role === "provider") return "Modo Prestador";
    return null;
}

function userInitial(name: string | undefined, email: string | null | undefined) {
    if (name?.trim()) {
        const p = name.trim().split(/\s+/);
        return p[0]!.slice(0, 1).toUpperCase();
    }
    if (email) return email.slice(0, 1).toUpperCase();
    return "U";
}

function abbreviatedName(name: string | undefined, email: string | null | undefined) {
    const n = (name ?? "").trim();
    if (!n) return email ?? "Minha conta";
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length <= 2) return n;
    const first = parts[0]!;
    const last = parts[parts.length - 1]!;
    const middle = parts.slice(1, -1).map((p) => `${p[0]?.toUpperCase()}.`);
    return [first, ...middle, last].join(" ");
}

export function Header() {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const {user, profile, email, avatarUrl, isAdmin, loading, signOut} = useAuth();

    const closeMenu = useCallback(() => setMenuOpen(false), []);

    useEffect(() => {
        closeMenu();
    }, [pathname, closeMenu]);

    useEffect(() => {
        setProfileMenuOpen(false);
    }, [pathname]);

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

    useEffect(() => {
        if (!profileMenuOpen) return;
        const onClick = (ev: MouseEvent) => {
            if (!profileMenuRef.current?.contains(ev.target as Node)) {
                setProfileMenuOpen(false);
            }
        };
        const onEsc = (ev: KeyboardEvent) => {
            if (ev.key === "Escape") setProfileMenuOpen(false);
        };
        window.addEventListener("mousedown", onClick);
        window.addEventListener("keydown", onEsc);
        return () => {
            window.removeEventListener("mousedown", onClick);
            window.removeEventListener("keydown", onEsc);
        };
    }, [profileMenuOpen]);

    if (pathname === "/login" || pathname === "/register") return null;

    const me = profile ? profileHref(profile.role) : "/profile";
    const roleBadge = activeRoleLabel(profile?.role);
    const initial = userInitial(profile?.full_name, email);
    const displayName = abbreviatedName(profile?.full_name, email);

    return (
        <header
            className="sticky top-0 z-[100] border-b border-border bg-[rgba(13,31,23,0.92)] pt-[env(safe-area-inset-top)] backdrop-blur-[12px]">
            <Container
                className="flex min-h-[56px] items-center justify-between gap-3 py-2 sm:min-h-[64px] sm:py-0 md:min-h-[72px] xl:max-w-[1380px] 2xl:max-w-[1480px]">
                <Link
                    href="/"
                    className="flex min-h-[44px] min-w-[44px] shrink-0 items-center gap-2 font-serif text-lg font-semibold tracking-[0.12em] sm:gap-3 sm:text-xl md:text-2xl md:tracking-[2px]"
                >
                    <LogoLinkora className="h-9 w-9 shrink-0 text-gold sm:h-10 sm:w-10"/>
                    <span className="leading-none">LINKORA</span>
                </Link>

                <nav className="mx-2 hidden min-w-0 shrink lg:mx-3 lg:block xl:mx-4" aria-label="Principal">
                    <ul className="flex flex-nowrap items-center gap-4 xl:gap-6 2xl:gap-8">
                        {staticNav.slice(0, 2).map((item) => (
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
                        <HeaderContentNav/>
                        {staticNav.slice(2).map((item) => (
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

                <div className="hidden shrink-0 items-center gap-2 lg:flex xl:gap-4">
                    <div
                        className="flex min-h-[44px] w-[10rem] items-center justify-end xl:w-[11.5rem] 2xl:w-[12.5rem]">
                        {loading ? (
                            <span
                                className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-white/[0.06]"
                                aria-live="polite"
                                aria-label="Carregando sessão"
                            >
                <span className="h-2 w-16 animate-pulse rounded-full bg-white/15 2xl:w-20"/>
              </span>
                        ) : !user ? (
                            <Link
                                href="/login"
                                className="inline-flex min-h-[44px] w-full items-center justify-end whitespace-nowrap px-2 text-[15px] text-text-secondary transition-colors hover:text-gold"
                            >
                                Login
                            </Link>
                        ) : (
                            <div className="relative min-w-0 w-full" ref={profileMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setProfileMenuOpen((s) => !s)}
                                    className="inline-flex min-h-[44px] max-w-full items-center gap-2 whitespace-nowrap text-[15px] text-gold"
                                    aria-haspopup="menu"
                                    aria-expanded={profileMenuOpen}
                                >
                                  <span
                                      className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-light text-[11px] font-bold text-bg-primary">
                                    {avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element -- URL assinada do Supabase Storage
                                        <img src={avatarUrl} alt="" className="h-full w-full object-cover"/>
                                    ) : (
                                        initial
                                    )}
                                  </span>
                                    <div className={`flex flex-col`}>
                                    <span className="truncate">{displayName}</span>
                                        {roleBadge ? (
                                            <span
                                                className="inline-flex mt-1 rounded-full w-fit border border-gold/40 bg-gold/10 px-2 py-0.5 text-[9px] font-medium text-gold">
                                        {roleBadge}</span>
                                        ) : null}
                                    </div>
                                </button>

                                {profileMenuOpen ? (
                                    <div
                                        role="menu"
                                        className="absolute right-0 top-[calc(100%+0.55rem)] z-[140] w-[min(100vw-2rem,280px)] origin-top-right rounded-xl border border-border bg-bg-card p-2 shadow-2xl"
                                    >
                                        <Link
                                            href={me}
                                            role="menuitem"
                                            onClick={() => setProfileMenuOpen(false)}
                                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-primary hover:bg-bg-primary"
                                        >
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"
                                                 stroke="currentColor" strokeWidth="1.8" aria-hidden>
                                                <circle cx="12" cy="8" r="4"/>
                                                <path d="M4 20c1.5-3.5 4.5-5.5 8-5.5s6.5 2 8 5.5"/>
                                            </svg>
                                            Meu Perfil
                                        </Link>
                                        {isAdmin ? (
                                            <Link
                                                href="/admin"
                                                role="menuitem"
                                                onClick={() => setProfileMenuOpen(false)}
                                                className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gold hover:bg-bg-primary"
                                            >
                                                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none"
                                                     stroke="currentColor" strokeWidth="1.8" aria-hidden>
                                                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                                                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                                                </svg>
                                                Administração
                                            </Link>
                                        ) : null}
                                        <div className="my-2 border-t border-border"/>
                                        <button
                                            type="button"
                                            role="menuitem"
                                            onClick={() => {
                                                setProfileMenuOpen(false);
                                                void signOut();
                                            }}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-secondary hover:bg-bg-primary hover:text-gold"
                                        >
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"
                                                 stroke="currentColor" strokeWidth="1.8" aria-hidden>
                                                <path d="M9 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/>
                                                <path d="M16 17l5-5-5-5"/>
                                                <path d="M21 12H9"/>
                                            </svg>
                                            Sair
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                    <Link href="/professionals">
            <span
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-transparent bg-gold px-6 py-2.5 text-[15px] font-medium text-bg-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-gold-light hover:to-gold">
              Encontrar Profissional →
            </span>
                    </Link>
                </div>

                <div className="flex items-center gap-1 lg:hidden">
                    <div className="flex min-h-[44px] min-w-[44px] items-center justify-center">
                        {loading ? (
                            <span
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06]"
                                aria-label="Carregando sessão"
                            >
                <span className="h-4 w-4 animate-pulse rounded-full bg-white/15"/>
              </span>
                        ) : !user ? (
                            <Link
                                href="/login"
                                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-2 text-[15px] text-text-secondary transition-colors hover:text-gold"
                            >
                                Login
                            </Link>
                        ) : (
                            <Link
                                href={me}
                                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-2 text-[15px] text-gold"
                                aria-label="Meu perfil"
                            >
                <span
                    className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-green-light text-[11px] font-bold text-bg-primary">
                  {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- URL assinada do Supabase Storage
                      <img src={avatarUrl} alt="" className="h-full w-full object-cover"/>
                  ) : (
                      initial
                  )}
                </span>
                            </Link>
                        )}
                    </div>
                    {roleBadge ? (
                        <span
                            className="hidden rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold sm:inline-flex">
              {roleBadge}
            </span>
                    ) : null}
                    <button
                        type="button"
                        onClick={() => setMenuOpen(true)}
                        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-primary hover:bg-white/5"
                        aria-expanded={menuOpen}
                        aria-controls="mobile-menu"
                        aria-label="Abrir menu"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                             aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
                        </svg>
                    </button>
                </div>
            </Container>

            {menuOpen
                ? createPortal(
                    <>
                        <button
                            type="button"
                            className="fixed inset-0 z-[1000] bg-black/55 backdrop-blur-sm lg:hidden"
                            aria-label="Fechar menu"
                            onClick={closeMenu}
                        />
                        <div
                            id="mobile-menu"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Menu de navegação"
                            className="fixed inset-y-0 right-0 z-[1001] flex w-[min(100%,20rem)] flex-col border-l border-border bg-bg-primary pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-2xl lg:hidden"
                        >
                            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                                <span className="font-serif text-lg text-text-primary">Menu</span>
                                <button
                                    type="button"
                                    onClick={closeMenu}
                                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-secondary hover:bg-white/5 hover:text-gold"
                                    aria-label="Fechar menu"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                                         stroke="currentColor" aria-hidden>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>
                            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4" aria-label="Principal">
                                {staticNav.slice(0, 2).map((item) => (
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
                                <div className="px-1 py-2">
                                    <HeaderContentNavMobile onNavigate={closeMenu}/>
                                </div>
                                {staticNav.slice(2).map((item) => (
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
                                <div className="my-3 border-t border-border"/>
                                {!loading && !user ? (
                                    <>
                                        <Link
                                            href="/login"
                                            onClick={closeMenu}
                                            className="rounded-xl px-4 py-3.5 text-base text-text-secondary hover:bg-white/5 hover:text-gold"
                                        >
                                            Login
                                        </Link>
                                    </>
                                ) : user ? (
                                    <>
                                        <Link
                                            href={me}
                                            onClick={closeMenu}
                                            className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-base text-gold hover:bg-white/5"
                                        >
                        <span
                            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-green-light text-[10px] font-bold text-bg-primary">
                          {avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element -- URL assinada do Supabase Storage
                              <img src={avatarUrl} alt="" className="h-full w-full object-cover"/>
                          ) : (
                              initial
                          )}
                        </span>
                                            {displayName}
                                        </Link>
                                        {isAdmin ? (
                                            <Link
                                                href="/admin"
                                                onClick={closeMenu}
                                                className="rounded-xl px-4 py-3.5 text-base font-medium text-gold hover:bg-white/5"
                                            >
                                                Administração
                                            </Link>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                closeMenu();
                                                void signOut();
                                            }}
                                            className="rounded-xl px-4 py-3.5 text-left text-base text-text-secondary hover:bg-white/5 hover:text-gold"
                                        >
                                            Sair
                                        </button>
                                    </>
                                ) : null}
                                <Link
                                    href="/professionals"
                                    onClick={closeMenu}
                                    className="mt-2 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-gold px-4 py-3 text-center font-medium text-bg-primary"
                                >
                                    Encontrar Profissional →
                                </Link>
                            </nav>
                        </div>
                    </>,
                    document.body,
                )
                : null}
        </header>
    );
}
