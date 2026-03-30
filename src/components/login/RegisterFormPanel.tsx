"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { GoogleLoginButton } from "@/components/login/GoogleLoginButton";

const inputClassName =
  "min-h-[48px] w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-base text-text-primary outline-none transition placeholder:text-text-muted focus:border-gold";

type Role = "business" | "provider";

export function RegisterFormPanel() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("business");

  return (
    <div className="flex w-full flex-1 flex-col justify-center bg-bg-primary px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-12 md:px-12 lg:max-w-xl lg:bg-bg-secondary/40 lg:px-16">
      <div className="mx-auto w-full max-w-md animate-fade-in">
        <h2 className="font-serif text-2xl font-medium text-text-primary sm:text-3xl md:text-4xl">
          Criar conta
        </h2>
        <p className="mt-2 text-sm text-text-secondary sm:text-base">
          Conecte-se aos melhores da moda com a mesma experiência em todos os dispositivos.
        </p>

        <form
          className="mt-8 flex flex-col gap-4 sm:mt-10 sm:gap-5"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            router.push("/user-profile");
          }}
        >
          <fieldset className="space-y-3">
            <legend className="mb-1 text-sm font-medium text-text-secondary">
              Como você usa o Linkora?
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setRole("business")}
                className={`rounded-xl border p-4 text-left transition ${
                  role === "business"
                    ? "border-gold bg-[rgba(201,168,76,0.1)]"
                    : "border-border bg-bg-card hover:border-gold/50"
                }`}
              >
                <span className="mb-1 block text-base font-medium text-gold">Sou empresário</span>
                <span className="text-[13px] leading-snug text-text-secondary">
                  Quero contratar profissionais e fornecedores.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRole("provider")}
                className={`rounded-xl border p-4 text-left transition ${
                  role === "provider"
                    ? "border-green-light bg-[rgba(46,125,82,0.12)]"
                    : "border-border bg-bg-card hover:border-green-light/50"
                }`}
              >
                <span className="mb-1 block text-base font-medium text-green-light">
                  Sou prestador
                </span>
                <span className="text-[13px] leading-snug text-text-secondary">
                  Quero oferecer serviços e portfólio.
                </span>
              </button>
            </div>
          </fieldset>

          <div>
            <label htmlFor="register-name" className="mb-2 block text-sm font-medium text-text-secondary">
              Nome completo
            </label>
            <input
              id="register-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Seu nome"
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="register-email" className="mb-2 block text-sm font-medium text-text-secondary">
              E-mail
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              className={inputClassName}
            />
          </div>
          <div>
            <label
              htmlFor="register-password"
              className="mb-2 block text-sm font-medium text-text-secondary"
            >
              Senha
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={inputClassName}
            />
          </div>

          <Button type="submit" variant="gold" className="mt-1 min-h-[48px] w-full py-3.5">
            Criar minha conta
          </Button>
        </form>

        <div className="relative my-8 sm:my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="bg-bg-primary px-4 text-text-muted lg:bg-bg-secondary/40">ou</span>
          </div>
        </div>

        <GoogleLoginButton />

        <p className="mt-8 text-center text-sm text-text-muted sm:mt-10">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-medium text-gold transition hover:text-gold-light">
            Entrar
          </Link>
        </p>
        <p className="mt-5 text-center text-sm sm:mt-6">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center text-text-secondary transition hover:text-gold"
          >
            ← Voltar ao início
          </Link>
        </p>
      </div>
    </div>
  );
}
