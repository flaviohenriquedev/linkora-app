"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { KaAvatar } from "@/components/ka/KaAvatar";

const CHIPS = [
  "Como montar uma grade de tamanhos?",
  "Quais aviamentos usar em jeans?",
  "Como precificar minha coleção?",
  "Diferença entre modelagem plana e moulage",
];

const KA_RESPONSES = [
  "Uma boa grade começa analisando o público-alvo. Para o Brasil, o padrão ABNT é um ótimo ponto de partida.",
  "Para jeans, a escolha dos botões e rebites é vital. Recomendo ligas de latão ou zamac que não enferrujam na lavanderia.",
  "A precificação ideal na moda envolve custos variáveis, fixos proporcionais e margem de lucro.",
  "A modelagem plana é feita no papel com medidas; o moulage é feito diretamente no manequim.",
];

type Msg = { role: "user" | "ka"; text: string };

export function KaChat() {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  const sendText = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      setInput("");
      setMsgs((m) => [...m, { role: "user", text }]);
      setTyping(true);
      scrollBottom();
      setTimeout(() => {
        setTyping(false);
        const reply = KA_RESPONSES[Math.floor(Math.random() * KA_RESPONSES.length)];
        setMsgs((m) => [...m, { role: "ka", text: reply }]);
        scrollBottom();
      }, 1200 + Math.random() * 800);
    },
    [scrollBottom],
  );

  return (
    <div className="mx-auto flex max-w-[800px] min-h-[calc(100vh-72px)] flex-col px-4 pb-6">
      <div className="shrink-0 py-8 text-center">
        <div className="mx-auto mb-5 h-[112px] w-[112px] sm:h-[120px] sm:w-[120px]">
          <KaAvatar priority />
        </div>
        <h1 className="mb-1 font-serif text-3xl">Ka</h1>
        <p className="mb-3 text-text-secondary">Especialista em Confecção de Moda</p>
        <div className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-1 text-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-light" />
          Online agora
        </div>
      </div>

      <div
        ref={listRef}
        className="mb-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1"
      >
        <div className="rounded-2xl rounded-bl-md border border-green-main/30 bg-[rgba(46,125,82,0.1)] px-5 py-4 text-text-secondary">
          Olá! Sou a Ka, sua assistente virtual focada no universo da moda.
        </div>
        <div className="rounded-2xl rounded-bl-md border border-green-main/30 bg-[rgba(46,125,82,0.1)] px-5 py-4 text-text-secondary">
          Estou aqui para tirar dúvidas técnicas, ajudar com fornecedores ou te dar dicas de negócios.
        </div>
        <div className="rounded-2xl rounded-bl-md border border-green-main/30 bg-[rgba(46,125,82,0.1)] px-5 py-4 text-text-secondary">
          Como posso ajudar sua confecção hoje?
        </div>
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div
              key={i}
              className="self-end max-w-[80%] rounded-2xl rounded-br-none border border-gold/30 bg-[rgba(201,168,76,0.1)] px-5 py-4 text-gold animate-fade-in"
            >
              {m.text}
            </div>
          ) : (
            <div
              key={i}
              className="self-start max-w-[80%] rounded-2xl rounded-bl-none border border-green-main/30 bg-[rgba(46,125,82,0.1)] px-5 py-4 text-text-secondary animate-fade-in"
            >
              {m.text}
            </div>
          ),
        )}
        {typing && (
          <div className="self-start max-w-[80%] rounded-2xl rounded-bl-none border border-green-main/30 bg-[rgba(46,125,82,0.1)] px-5 py-4 text-text-secondary animate-pulse">
            Ka está digitando...
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-4">
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => sendText(c)}
              className="rounded-full border border-gold/30 px-4 py-1.5 text-[13px] text-gold transition hover:bg-gold/10"
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 rounded-[28px] border border-border bg-bg-card p-2 sm:flex-row sm:gap-3 sm:rounded-[32px]">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendText(input)}
            placeholder="Pergunte à Ka..."
            className="min-h-[48px] min-w-0 flex-1 rounded-2xl border-0 bg-transparent px-4 text-base text-text-primary outline-none placeholder:text-text-muted sm:min-h-0 sm:rounded-none sm:px-4"
          />
          <Button
            variant="green"
            className="min-h-[48px] w-full shrink-0 rounded-2xl px-6 sm:w-auto sm:rounded-3xl"
            onClick={() => sendText(input)}
          >
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}
