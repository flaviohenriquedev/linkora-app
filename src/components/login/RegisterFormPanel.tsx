"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { GoogleLoginButton } from "@/components/login/GoogleLoginButton";
import { createClient } from "@/lib/supabase/client";

const inputClassName =
  "min-h-[48px] w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-base text-text-primary outline-none transition placeholder:text-text-muted focus:border-gold";

type Role = "business" | "provider";

function roleToDb(role: Role): "owner" | "provider" {
  return role === "business" ? "owner" : "provider";
}

function homePath(role: Role): string {
  return role === "provider" ? "/profile" : "/owner";
}

export function RegisterFormPanel() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("business");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function activateRole() {
    await fetch("/api/auth/activate-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: roleToDb(role) }),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim(),
          role: roleToDb(role),
        },
      },
    });

    if (signError) {
      // Mesmo e-mail pode assumir os dois papéis no mesmo usuário.
      // Se já existir e a senha bater, apenas ativa o papel selecionado.
      if (
        signError.message.toLowerCase().includes("already registered") ||
        signError.message.toLowerCase().includes("already been registered")
      ) {
        const { error: loginErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (!loginErr) {
          await activateRole();
          router.push(homePath(role));
          router.refresh();
          setLoading(false);
          return;
        }
      }
      setError(signError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      await activateRole();
      router.push(homePath(role));
      router.refresh();
      setLoading(false);
      return;
    }

    setInfo(
      "Enviamos um link de confirmação para o seu e-mail. Depois de confirmar, você poderá entrar.",
    );
    setLoading(false);
  }

  return (
    <div className="flex w-full shrink-0 flex-col justify-start bg-bg-primary px-5 pb-[max(2.75rem,env(safe-area-inset-bottom)+0.5rem)] pt-6 sm:px-6 sm:pb-12 sm:pt-10 md:px-12 md:pt-12 lg:bg-bg-secondary/40 lg:px-16 lg:pt-14 lg:pb-16">
      <div className="mx-auto w-full max-w-xl animate-fade-in">
        <h2 className="font-serif text-[1.65rem] font-medium leading-tight tracking-tight text-text-primary sm:text-3xl sm:leading-snug md:text-4xl">
          Criar conta
        </h2>
        <p className="mt-2.5 max-w-[32ch] text-[15px] leading-relaxed text-text-secondary sm:mt-3 sm:max-w-none sm:text-base">
          Conecte-se aos melhores da moda com a mesma experiência em todos os dispositivos.
        </p>

        <form
          className="mt-7 flex flex-col gap-4 sm:mt-10 sm:gap-5"
          noValidate
          onSubmit={(e) => void handleSubmit(e)}
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
              value={name}
              onChange={(ev) => setName(ev.target.value)}
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
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
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
            <div className="relative">
              <input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                className={`${inputClassName} pr-12`}
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-text-muted hover:bg-bg-primary hover:text-gold"
                onClick={() => setShowPassword((s) => !s)}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {info ? <p className="text-sm text-text-secondary">{info}</p> : null}

          <Button type="submit" variant="gold" className="mt-1 min-h-[48px] w-full py-3.5" disabled={loading}>
            {loading ? "Criando…" : "Criar minha conta"}
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

        <GoogleLoginButton pendingRole={roleToDb(role)} nextPath={homePath(role)} />

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
