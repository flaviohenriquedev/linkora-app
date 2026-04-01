"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const MAX = 8;

type NavCol = {
  label: string;
  href: string;
  pathPrefix: string;
  items: { title: string; href: string }[];
};

function isActive(pathname: string, prefix: string) {
  if (prefix === "/") return pathname === "/";
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function HeaderContentNav() {
  const pathname = usePathname();
  const [cols, setCols] = useState<NavCol[]>([
    { label: "Artigos", href: "/articles", pathPrefix: "/articles", items: [] },
    { label: "Cursos", href: "/courses", pathPrefix: "/courses", items: [] },
    { label: "Materiais", href: "/materials", pathPrefix: "/materials", items: [] },
  ]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [ar, cr, mat] = await Promise.all([
          fetch("/api/public/articles", { cache: "no-store" }).then((r) => r.json()) as Promise<{
            articles?: { title: string; slug: string }[];
          }>,
          fetch("/api/public/courses", { cache: "no-store" }).then((r) => r.json()) as Promise<{
            courses?: { title: string; slug: string }[];
          }>,
          fetch("/api/public/materials", { cache: "no-store" }).then((r) => r.json()) as Promise<{
            materials?: { id: string; title: string }[];
          }>,
        ]);
        if (cancelled) return;
        setCols([
          {
            label: "Artigos",
            href: "/articles",
            pathPrefix: "/articles",
            items: (ar.articles ?? []).slice(0, MAX).map((a) => ({
              title: a.title,
              href: `/articles/${a.slug}`,
            })),
          },
          {
            label: "Cursos",
            href: "/courses",
            pathPrefix: "/courses",
            items: (cr.courses ?? []).slice(0, MAX).map((c) => ({
              title: c.title,
              href: `/courses/${c.slug}`,
            })),
          },
          {
            label: "Materiais",
            href: "/materials",
            pathPrefix: "/materials",
            items: (mat.materials ?? []).slice(0, MAX).map((m) => ({
              title: m.title,
              href: `/materials?open=${encodeURIComponent(m.id)}`,
            })),
          },
        ]);
      } catch {
        /* keep empty lists */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {cols.map((col) => (
        <li key={col.href} className="group relative shrink-0">
          <Link
            href={col.href}
            className={`inline-flex min-h-[44px] items-center whitespace-nowrap text-[15px] transition-colors duration-300 ${
              isActive(pathname, col.pathPrefix) ? "text-gold" : "text-text-secondary hover:text-gold"
            }`}
          >
            {col.label}
            <span className="ml-0.5 text-[10px] opacity-70" aria-hidden>
              ▾
            </span>
          </Link>
          {col.items.length > 0 ? (
            <div
              className="invisible absolute left-0 top-full z-[120] w-[min(100vw-2rem,440px)] min-w-[300px] pt-2 opacity-0 transition-[opacity,visibility] duration-150 group-hover:visible group-hover:opacity-100"
              role="menu"
            >
              <div className="rounded-xl border border-border bg-bg-card py-2 shadow-2xl">
                {col.items.map((it) => (
                  <Link
                    key={it.href}
                    href={it.href}
                    role="menuitem"
                    className="block px-4 py-2.5 text-left text-[14px] leading-snug text-text-secondary transition hover:bg-bg-primary hover:text-gold"
                  >
                    <span className="line-clamp-2">{it.title}</span>
                  </Link>
                ))}
                <div className="border-t border-border px-2 py-2">
                  <Link
                    href={col.href}
                    className="block rounded-lg px-2 py-2 text-center text-[13px] font-medium text-gold hover:bg-bg-primary"
                  >
                    Ver todos →
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </li>
      ))}
    </>
  );
}

/** Mobile: só links para as seções — sem submenu nem fetch. */
export function HeaderContentNavMobile({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const links = [
    { href: "/articles", label: "Artigos", prefix: "/articles" as const },
    { href: "/courses", label: "Cursos", prefix: "/courses" as const },
    { href: "/materials", label: "Materiais", prefix: "/materials" as const },
  ];

  return (
    <div className="flex flex-col gap-1">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          onClick={onNavigate}
          className={`rounded-xl px-4 py-3.5 text-base transition-colors ${
            isActive(pathname, l.prefix)
              ? "bg-gold/10 font-medium text-gold"
              : "text-text-secondary hover:bg-white/5 hover:text-gold"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
