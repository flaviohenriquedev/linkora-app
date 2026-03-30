"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

type Bubble = { from: "me" | "them"; text: string; time: string };

const INITIAL: Bubble[] = [
  {
    from: "me",
    text: "Oi, Ana! Gostei muito do seu portfólio. Você faz desenvolvimento de alfaiataria?",
    time: "10:30",
  },
  {
    from: "them",
    text: "Olá! Faço sim. Inclusive tenho focado bastante nisso ultimamente. Qual seria a complexidade das peças?",
    time: "10:35",
  },
  {
    from: "me",
    text: "Seriam 5 blazers com forro completo e 3 calças de alfaiataria.",
    time: "10:38",
  },
  {
    from: "them",
    text: "Perfeito. Para essa quantia, consigo fechar R$ 4.000 o desenvolvimento.",
    time: "10:40",
  },
  {
    from: "me",
    text: "Podemos fechar nesse valor!",
    time: "10:42",
  },
];

export function ChatInterface() {
  const [rows, setRows] = useState<Bubble[]>(INITIAL);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  function send() {
    const t = text.trim();
    if (!t) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setRows((r) => [...r, { from: "me", text: t, time }]);
    setText("");
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
    setTimeout(() => {
      setRows((r) => [
        ...r,
        { from: "them", text: "Certo, vou verificar e te retorno.", time },
      ]);
    }, 1500);
  }

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col gap-4 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 sm:gap-6 sm:px-6 md:flex-row">
      <aside className="flex max-h-[38vh] w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-bg-card sm:max-h-[42vh] md:max-h-none md:h-[min(560px,calc(100dvh-8rem))] md:w-[320px]">
        <div className="border-b border-border p-5">
          <h2 className="mb-4 text-xl">Mensagens</h2>
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-bg-secondary p-1.5">
            <input
              placeholder="Buscar contato..."
              className="w-full border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-text-muted"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {[
            { ab: "AB", name: "Ana Beatriz Costa", sub: "Podemos fechar nesse valor!", t: "10:42", active: true },
            { ab: "FL", name: "Fernanda Lima", sub: "Enviei o orçamento pro seu email.", t: "Ontem", active: false },
            { ab: "CM", name: "Carlos Mendes", sub: "Os moldes já estão prontos.", t: "Terça", active: false },
          ].map((c) => (
            <button
              key={c.name}
              type="button"
              className={`flex w-full gap-4 border-b border-border px-5 py-4 text-left transition hover:bg-[rgba(201,168,76,0.05)] ${
                c.active ? "border-l-[3px] border-l-gold bg-[rgba(201,168,76,0.05)]" : ""
              }`}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
                style={{
                  backgroundColor: c.ab === "FL" ? "#C9A84C" : c.ab === "CM" ? "#7B4EA6" : "#2E7D52",
                }}
              >
                {c.ab}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <strong className="truncate text-[15px]">{c.name}</strong>
                  <span className="shrink-0 text-xs text-text-muted">{c.t}</span>
                </div>
                <p className="truncate text-[13px] text-text-secondary">{c.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-h-[min(320px,calc(100dvh-14rem))] flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-bg-card md:min-h-[min(520px,calc(100dvh-8rem))]">
        <div className="flex items-center gap-4 border-b border-border p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-main text-lg font-semibold text-white">
            AB
          </div>
          <div>
            <strong className="block text-base">Ana Beatriz Costa</strong>
            <span className="text-[13px] text-green-light">Online</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
          {rows.map((m, i) => (
            <div
              key={i}
              className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm animate-fade-in ${
                m.from === "me"
                  ? "self-end rounded-br-none bg-green-main text-white"
                  : "self-start rounded-bl-none border border-border bg-bg-secondary text-text-primary"
              }`}
            >
              {m.text}
              <div
                className={`mt-1 text-[11px] ${
                  m.from === "me" ? "text-right text-white/70" : "text-text-muted"
                }`}
              >
                {m.time}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="flex flex-col gap-2 border-t border-border p-4 sm:flex-row sm:items-center sm:gap-3 sm:p-5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Digite sua mensagem..."
            className="min-h-[48px] flex-1 rounded-2xl border border-border bg-bg-secondary px-4 py-3 text-base text-text-primary outline-none placeholder:text-text-muted sm:min-h-0 sm:rounded-full sm:px-5"
          />
          <Button variant="green" className="min-h-[48px] w-full shrink-0 rounded-2xl px-6 sm:w-auto sm:rounded-full" onClick={send}>
            Enviar
          </Button>
        </div>
      </section>
    </div>
  );
}
