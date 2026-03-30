"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export function ScheduleWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [day, setDay] = useState(15);

  return (
    <Container className="max-w-[800px] py-14">
      <h1 className="mb-10 text-center font-serif text-3xl md:text-4xl">
        Agendar com Profissional
      </h1>

      <div className="relative mb-10 flex justify-between">
        <div className="absolute left-0 right-0 top-[15px] z-[1] h-0.5 bg-border" />
        <div
          className="absolute left-0 top-[15px] z-[2] h-0.5 bg-gold transition-[width] duration-300"
          style={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
        />
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className="relative z-[3] flex flex-col items-center gap-2"
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                s <= step
                  ? "bg-gold text-bg-primary"
                  : "border-2 border-border bg-bg-card text-text-muted"
              }`}
            >
              {s}
            </div>
            <span
              className={`text-sm ${s <= step ? "text-gold" : "text-text-muted"}`}
            >
              {s === 1 ? "Serviço" : s === 2 ? "Data e Hora" : "Confirmação"}
            </span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <h2 className="mb-6 text-xl">Escolha o serviço</h2>
          <div className="flex flex-col gap-4">
            <label className="flex cursor-pointer items-center gap-4 rounded-lg border border-border bg-bg-card p-5 transition hover:border-gold">
              <input type="radio" name="service" className="accent-gold" defaultChecked />
              <div>
                <h3 className="text-base">Reunião de Alinhamento (Online)</h3>
                <p className="text-sm text-text-secondary">45 min — Gratuito</p>
              </div>
            </label>
            <label className="flex cursor-pointer items-center gap-4 rounded-lg border border-border bg-bg-card p-5 transition hover:border-gold">
              <input type="radio" name="service" className="accent-gold" />
              <div>
                <h3 className="text-base">Consultoria Técnica</h3>
                <p className="text-sm text-text-secondary">2h — R$ 350,00</p>
              </div>
            </label>
          </div>
          <div className="mt-8 text-right">
            <Button variant="gold" onClick={() => setStep(2)}>
              Continuar →
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="mb-6 text-xl">Escolha a data e horário</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-bg-card p-4">
              <div className="mb-4 flex items-center justify-between">
                <Button variant="outline" className="px-3 py-1 text-sm">
                  &lt;
                </Button>
                <strong>Dezembro 2024</strong>
                <Button variant="outline" className="px-3 py-1 text-sm">
                  &gt;
                </Button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                  <div key={`w-${i}`} className="mb-2 text-text-muted">
                    {d}
                  </div>
                ))}
                {DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDay(d)}
                    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition ${
                      d === day
                        ? "bg-gold font-bold text-bg-primary"
                        : "hover:bg-bg-secondary"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-base">Horários disponíveis</h3>
              <div className="grid grid-cols-2 gap-3">
                {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map((t, i) => (
                  <Button
                    key={t}
                    variant="outline"
                    className={`w-full ${i === 0 ? "border-gold text-gold" : ""}`}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              ← Voltar
            </Button>
            <Button variant="gold" onClick={() => setStep(3)}>
              Continuar →
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="mb-6 text-xl">Confirmar Agendamento</h2>
          <div className="mb-6 rounded-lg border border-border bg-bg-card p-6 text-text-secondary">
            <p className="mb-2">
              <strong className="text-text-primary">Profissional:</strong> Ana Beatriz Costa
            </p>
            <p className="mb-2">
              <strong className="text-text-primary">Serviço:</strong> Reunião de Alinhamento (Online)
            </p>
            <p>
              <strong className="text-text-primary">Data e Hora:</strong> 15 de Dezembro, 09:00
            </p>
          </div>
          <textarea
            placeholder="Alguma observação para o profissional? (Opcional)"
            className="mb-6 h-32 w-full resize-y rounded-lg border border-border bg-bg-card p-4 text-text-primary outline-none placeholder:text-text-muted"
          />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              ← Voltar
            </Button>
            <Button
              variant="green"
              onClick={() => {
                alert("Agendamento confirmado com sucesso! Verifique seu e-mail.");
                router.push("/");
              }}
            >
              Confirmar Agendamento
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
}
