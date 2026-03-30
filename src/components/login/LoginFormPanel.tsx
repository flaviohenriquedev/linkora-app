"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { GoogleLoginButton } from "@/components/login/GoogleLoginButton";

export function LoginFormPanel() {
  return (
    <div className="flex w-full shrink-0 flex-col justify-start bg-bg-primary px-5 pb-[max(2.75rem,env(safe-area-inset-bottom)+0.5rem)] pt-6 sm:px-6 sm:pb-12 sm:pt-10 md:px-12 md:pt-12 lg:max-w-xl lg:bg-bg-secondary/40 lg:px-16 lg:pt-14 lg:pb-16">
      <div className="mx-auto w-full max-w-md animate-fade-in">
        <h2 className="font-serif text-[1.65rem] font-medium leading-tight tracking-tight text-text-primary sm:text-3xl sm:leading-snug md:text-4xl">
          Bem-vindo de volta
        </h2>
        <p className="mt-2.5 max-w-[28ch] text-[15px] leading-relaxed text-text-secondary sm:mt-3 sm:max-w-none sm:text-base">
          Entre na sua conta para continuar no Linkora.
        </p>

        <form
          className="mt-7 flex flex-col gap-4 sm:mt-10 sm:gap-5"
          noValidate
          onSubmit={(e) => e.preventDefault()}
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-text-secondary"
            >
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              className="min-h-[48px] w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-base text-text-primary outline-none ring-0 transition placeholder:text-text-muted focus:border-gold"
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-text-secondary"
              >
                Senha
              </label>
              <span className="text-xs text-text-muted">Em breve</span>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="min-h-[48px] w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-base text-text-primary outline-none transition placeholder:text-text-muted focus:border-gold"
            />
          </div>
          <Button type="submit" variant="gold" className="mt-1 min-h-[48px] w-full py-3.5">
            Entrar
          </Button>
        </form>

        <div className="relative my-8 sm:my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="bg-bg-primary px-4 text-text-muted lg:bg-bg-secondary/40">
              ou
            </span>
          </div>
        </div>

        <GoogleLoginButton />

        <p className="mt-8 text-center text-sm text-text-muted sm:mt-10">
          Ainda não tem conta?{" "}
          <Link
            href="/register"
            className="font-medium text-gold transition hover:text-gold-light"
          >
            Criar conta
          </Link>
        </p>
        <p className="mt-5 text-center text-sm sm:mt-6">
          <Link href="/" className="inline-flex min-h-[44px] items-center justify-center text-text-secondary transition hover:text-gold">
            ← Voltar ao início
          </Link>
        </p>
      </div>
    </div>
  );
}
