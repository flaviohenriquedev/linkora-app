"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { IconWhatsApp } from "@/components/icons/IconWhatsApp";
import { formatCentsToBrl } from "@/lib/currency";
import { presenceAvatarRingClass, type PresenceStatus } from "@/lib/presence-avatar";
import { portfolioCropAspectClass } from "@/lib/portfolio-crop-aspect";
import type { PublicProfessionalDetail } from "@/lib/public-professionals-shared";
import { buildWhatsAppChatUrl, normalizeWhatsappDigits } from "@/lib/whatsapp-links";

const TABS = [
  { id: "about", label: "Sobre" },
  { id: "services", label: "Serviços" },
  { id: "portfolio", label: "Portfólio" },
  { id: "reviews", label: "Avaliações" },
] as const;

type Props = {
  professional: PublicProfessionalDetail;
};

function stars(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

export function PublicProfessionalProfile({ professional: p }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("about");
  const [presence, setPresence] = useState<PresenceStatus>("offline");

  useEffect(() => {
    if (!user?.id) {
      setPresence("offline");
      return;
    }
    let cancelled = false;
    const load = () => {
      void fetch(`/api/presence/providers?ids=${encodeURIComponent(p.id)}`, { cache: "no-store" })
        .then((r) => r.json() as Promise<{ presence?: Record<string, string> }>)
        .then((j) => {
          if (cancelled) return;
          const v = j.presence?.[p.id];
          setPresence(v === "online" || v === "away" || v === "offline" ? v : "offline");
        })
        .catch(() => {
          if (!cancelled) setPresence("offline");
        });
    };
    load();
    const id = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user?.id, p.id]);

  return (
    <Container className="py-10">
      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-bg-card">
        <div className="h-[120px] bg-gradient-to-r from-bg-secondary to-green-main" />
        <div className="relative flex flex-wrap items-end gap-6 px-8 pb-8">
          <div
            className={`-mt-12 shrink-0 rounded-full border-4 border-bg-card ${presenceAvatarRingClass(presence)}`}
          >
            <div
              className="flex h-[100px] w-[100px] overflow-hidden rounded-full font-serif text-4xl font-semibold text-white"
              style={p.avatarUrl ? undefined : { backgroundColor: p.color }}
            >
              {p.avatarUrl ? (
                <img src={p.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center">{p.initials}</span>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1 pt-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="mb-1 font-serif text-2xl md:text-[28px]">{p.name}</h1>
                <span className="mb-2 inline-block rounded bg-[rgba(46,125,82,0.2)] px-2 py-0.5 text-xs text-green-light">
                  {p.specialty}
                </span>
                <p className="mt-1 text-text-muted">{p.city}</p>
                {p.priceLabel ? (
                  <p className="mt-2 text-sm font-medium text-gold">{p.priceLabel}</p>
                ) : null}
                <div className="mt-2 flex items-center gap-2 text-sm text-text-secondary">
                  <span className="text-gold">{stars(p.stars)}</span>
                  <span>({p.reviews} avaliações)</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/schedule">
                  <Button variant="green">Agendar</Button>
                </Link>
                <Link href={`/chat?peer=${p.id}`}>
                  <Button variant="outline">Chat</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-6 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`border-b-2 pb-3 text-[15px] transition ${
              tab === t.id
                ? "border-gold font-medium text-gold"
                : "border-transparent text-text-secondary hover:text-gold"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "about" && (
        <div>
          <h2 className="mb-4 text-xl">Sobre</h2>
          {p.bio?.trim() ? <p className="max-w-3xl whitespace-pre-line text-text-secondary">{p.bio}</p> : null}
          <div className="mt-6">
            <h3 className="mb-2 text-lg text-text-primary">Contatos</h3>
            {p.contacts.length ? (
              <ul className="space-y-2 text-sm text-text-secondary">
                {p.contacts.map((c) => {
                  const waDigits = c.type === "whatsapp" ? normalizeWhatsappDigits(c.value) : null;
                  const waHref =
                    waDigits != null ? buildWhatsAppChatUrl(waDigits, p.whatsappOpenMessage) : null;
                  return (
                    <li key={c.id} className="rounded-lg border border-border bg-bg-card px-3 py-2">
                      <span className="text-text-muted">{c.label?.trim() || c.type}: </span>
                      {c.type === "email" ? (
                        <a className="text-gold hover:underline" href={`mailto:${c.value}`}>
                          {c.value}
                        </a>
                      ) : c.type === "whatsapp" ? (
                        waHref ? (
                          <a
                            className="inline-flex items-center gap-1.5 text-gold hover:underline"
                            href={waHref}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <IconWhatsApp className="h-4 w-4 shrink-0" />
                            {c.value}
                          </a>
                        ) : (
                          <span className="text-text-secondary">{c.value}</span>
                        )
                      ) : (
                        <a className="text-gold hover:underline" href={`tel:${c.value.replace(/\s+/g, "")}`}>
                          {c.value}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-text-muted">Prestador não informou contatos públicos.</p>
            )}
          </div>
        </div>
      )}

      {tab === "services" && (
        <div className="flex flex-col gap-4">
          {p.services.length === 0 ? (
            <p className="text-text-muted">Nenhum serviço cadastrado ainda.</p>
          ) : (
            p.services.map((s) => (
              <div
                key={s.id}
                className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-bg-card p-6 sm:flex-row sm:items-start"
              >
                <div className="min-w-0">
                  <h3 className="mb-1 text-lg text-text-primary">{s.title}</h3>
                  {s.category ? (
                    <span className="mb-2 inline-block text-xs text-green-light">{s.category.name}</span>
                  ) : null}
                  {s.description ? (
                    <p className="mt-1 text-sm text-text-secondary">{s.description}</p>
                  ) : null}
                </div>
                <span className="shrink-0 font-medium text-gold sm:pt-0.5 sm:text-right">
                  {s.price_cents != null && Number.isFinite(s.price_cents)
                    ? `R$ ${formatCentsToBrl(s.price_cents)}`
                    : "Sob consulta"}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "portfolio" && (
        <div className="pt-1">
          {p.portfolioPosts.length === 0 ? (
            <p className="text-text-muted">Este prestador ainda não publicou fotos no portfólio.</p>
          ) : (
            <ul className="mx-auto grid max-w-5xl grid-cols-1 gap-5 min-[520px]:grid-cols-2 min-[900px]:grid-cols-3 sm:gap-6">
              {p.portfolioPosts.map((post) => (
                <li
                  key={post.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-bg-card shadow-sm ring-1 ring-black/[0.03] transition-[box-shadow,border-color] hover:border-border hover:shadow-md"
                >
                  <div
                    className={`relative w-full overflow-hidden bg-bg-primary ${portfolioCropAspectClass(post.crop_aspect)}`}
                  >
                    {post.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- URL assinada
                      <img
                        src={post.imageUrl}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full min-h-[140px] items-center justify-center text-sm text-text-muted">
                        Foto
                      </div>
                    )}
                  </div>
                  {post.caption?.trim() ? (
                    <p className="border-t border-border/70 px-4 py-3 text-left text-sm leading-relaxed text-text-secondary">
                      {post.caption}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "reviews" && <p className="text-text-muted">Avaliações em breve.</p>}
    </Container>
  );
}
