"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

const TABS = [
  { id: "subscriptions", label: "Assinaturas" },
  { id: "history", label: "Histórico" },
  { id: "support", label: "Suporte" },
] as const;

export function UserProfileView() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("subscriptions");

  return (
    <Container className="max-w-[900px] py-10">
      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-bg-card">
        <div className="h-[100px] bg-gradient-to-r from-bg-card to-gold" />
        <div className="flex flex-wrap items-end justify-between gap-4 px-8 pb-8">
          <div className="-mt-10 flex items-end gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-bg-card bg-green-main text-3xl font-bold text-white">
              U
            </div>
            <div className="pb-1">
              <h1 className="mb-1 text-2xl">Usuário Linkora</h1>
              <span className="inline-block rounded bg-[rgba(46,125,82,0.2)] px-2 py-0.5 text-xs text-green-light">
                Empresário
              </span>
            </div>
          </div>
          <Button variant="outline" className="self-end">
            Editar Perfil
          </Button>
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

      {tab === "subscriptions" && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gold bg-gradient-to-br from-[rgba(201,168,76,0.1)] to-transparent p-8">
            <span className="mb-4 inline-block rounded-xl bg-gold px-3 py-1 text-xs font-bold text-bg-primary">
              PLANO ATIVO
            </span>
            <h2 className="mb-2 font-serif text-2xl text-gold-light">Linkora Pro Empresário</h2>
            <p className="mb-6 text-text-secondary">
              Acesso ilimitado a contatos e suporte prioritário com a IA Ka.
            </p>
            <div className="flex items-center justify-between">
              <strong className="text-xl">
                R$ 49,90{" "}
                <span className="text-sm font-normal text-text-muted">/mês</span>
              </strong>
              <Button variant="outline" className="border-gold text-gold">
                Gerenciar
              </Button>
            </div>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div>
          <h2 className="mb-6 text-xl">Seus Agendamentos Recentes</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-main font-bold text-white">
                  AB
                </div>
                <div>
                  <strong>Ana Beatriz Costa</strong>
                  <div className="text-sm text-text-secondary">Reunião de Alinhamento</div>
                </div>
              </div>
              <div className="text-right">
                <span className="mb-1 inline-block rounded-xl bg-[rgba(46,125,82,0.2)] px-3 py-1 text-xs text-green-light">
                  Concluído
                </span>
                <div className="text-xs text-text-muted">15 Dez 2024</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold font-bold text-white">
                  FL
                </div>
                <div>
                  <strong>Fernanda Lima</strong>
                  <div className="text-sm text-text-secondary">Corte a Laser - Orçamento</div>
                </div>
              </div>
              <div className="text-right">
                <span className="mb-1 inline-block rounded-xl bg-[rgba(201,168,76,0.2)] px-3 py-1 text-xs text-gold">
                  Agendado
                </span>
                <div className="text-xs text-text-muted">20 Jan 2025</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "support" && (
        <div>
          <h2 className="mb-4 text-xl">Central de Ajuda e Suporte</h2>
          <p className="mb-8 max-w-2xl text-text-secondary">
            Problemas com a plataforma, dúvidas sobre assinaturas ou denúncias de profissionais?
            Nossa equipe está pronta para te atender.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-xl border border-border bg-bg-card p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-green-main bg-[rgba(46,125,82,0.1)] text-2xl">
                ✉️
              </div>
              <h3 className="mb-2 text-lg">Por E-mail</h3>
              <p className="mb-6 text-sm text-text-secondary">
                Para questões detalhadas, anexos e disputas comerciais.
              </p>
              <a
                href="mailto:hub.linkora@gmail.com"
                className="inline-block w-fit rounded-lg border border-border bg-bg-secondary px-5 py-2.5 font-medium text-white transition hover:border-gold"
              >
                hub.linkora@gmail.com
              </a>
            </div>
            <div className="flex flex-col rounded-xl border border-border bg-bg-card p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-green-light bg-[rgba(46,125,82,0.1)] text-2xl">
                💬
              </div>
              <h3 className="mb-2 text-lg">WhatsApp Integrado</h3>
              <p className="mb-6 text-sm text-text-secondary">
                Atendimento rápido e direto com nossos analistas no Brasil.
              </p>
              <a
                href="https://wa.me/5562993458746"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-fit rounded-lg border border-[#1DA851] bg-[#25D366] px-5 py-2.5 font-medium text-white transition hover:bg-[#1DA851]"
              >
                +55 62 99345-8746
              </a>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
