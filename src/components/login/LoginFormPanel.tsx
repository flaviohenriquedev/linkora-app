"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GoogleLoginButton } from "@/components/login/GoogleLoginButton";
import { createClient } from "@/lib/supabase/client";

const INACTIVE_LOGIN_MESSAGE =
    "Não foi possível acessar sua conta no momento. Para reativar o acesso, entre em contato com o suporte.";

type Props = {
    nextPath?: string;
    /** Compat legado do callback OAuth. */
    initialNeedOwnerRegister?: boolean;
    /** Conta desativada (redirect OAuth ou sessão). */
    initialInactive?: boolean;
};

type Role = "business" | "provider";

function roleToDb(role: Role): "owner" | "provider" {
    return role === "business" ? "owner" : "provider";
}

type ActivateResult = { ok: true };
type AccountStatus = {
    exists?: boolean;
    oauthOnly?: boolean;
    hasPassword?: boolean;
    roles?: ("owner" | "provider")[];
};

export function LoginFormPanel({
                                   nextPath = "/",
                                   initialNeedOwnerRegister = false,
                                   initialInactive = false,
                               }: Props) {
    const router = useRouter();
    const [role, setRole] = useState<Role>("provider");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordSetupMode, setPasswordSetupMode] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [pendingOwnerAttach, setPendingOwnerAttach] = useState<{
        email: string;
        password: string;
        status: AccountStatus;
    } | null>(null);
    const handledOAuthOwnerHint = useRef(false);

    const safeNext = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;

    const cleanLoginHref =
        safeNext === "/" ? "/login" : `/login?next=${encodeURIComponent(safeNext)}`;

    useEffect(() => {
        if (!initialNeedOwnerRegister || handledOAuthOwnerHint.current) return;
        handledOAuthOwnerHint.current = true;
        setError("Conta de Empresário ativada para este login.");
        router.replace(cleanLoginHref);
    }, [initialNeedOwnerRegister, router, cleanLoginHref]);

    useEffect(() => {
        if (initialInactive) setError(INACTIVE_LOGIN_MESSAGE);
    }, [initialInactive]);

    const activateRole = useCallback(async (dbRole: "owner" | "provider"): Promise<ActivateResult> => {
        const supabase = createClient();
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
            throw new Error("Sessão não encontrada. Recarregue a página e entre novamente.");
        }

        const res = await fetch("/api/auth/activate-role", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            credentials: "include",
            body: JSON.stringify({ role: dbRole }),
        });

        const text = await res.text();
        let json: { error?: string } = {};
        try {
            json = text ? (JSON.parse(text) as typeof json) : {};
        } catch {
            throw new Error(text?.slice(0, 120) || "Resposta inválida do servidor");
        }
        if (!res.ok) throw new Error(json.error ?? "Falha ao ativar tipo de conta");
        return { ok: true };
    }, []);

    const pushAfterActivate = useCallback(() => {
        router.push("/");
        router.refresh();
    }, [router]);

    const fetchAccountStatus = useCallback(async (inputEmail: string): Promise<AccountStatus> => {
        const res = await fetch("/api/auth/account-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: inputEmail.trim() }),
        });
        const json = (await res.json()) as AccountStatus & { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Não foi possível verificar a conta");
        return json;
    }, []);

    const loginWithSelectedRole = useCallback(
        async (inputEmail: string, inputPassword: string, dbRole: "owner" | "provider", status: AccountStatus) => {
            const supabase = createClient();
            const { error: signError } = await supabase.auth.signInWithPassword({
                email: inputEmail.trim(),
                password: inputPassword,
            });

            if (signError) {
                const isInvalid = signError.message === "Invalid login credentials";
                if (isInvalid && status.hasPassword === false) {
                    setPasswordSetupMode(true);
                    setOtpSent(false);
                    setLoading(false);
                    return;
                }
                setError(isInvalid ? "Credenciais inválidas." : signError.message);
                setLoading(false);
                return;
            }

            const {
                data: {user: signedUser},
            } = await supabase.auth.getUser();
            if (signedUser) {
                const {data: prof} = await supabase
                    .from("profiles")
                    .select("is_active")
                    .eq("id", signedUser.id)
                    .maybeSingle();
                if (prof?.is_active === false) {
                    await supabase.auth.signOut();
                    setError(INACTIVE_LOGIN_MESSAGE);
                    setLoading(false);
                    return;
                }
            }

            await activateRole(dbRole);
            pushAfterActivate();
            setLoading(false);
        },
        [activateRole, pushAfterActivate],
    );

    async function handleEmailLogin(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        setPasswordSetupMode(false);
        setOtpSent(false);

        try {
            const selectedDbRole = roleToDb(role);
            const status = await fetchAccountStatus(email);
            const roles = status.roles ?? [];

            if (!status.exists) {
                setError("Usuário não cadastrado.");
                setLoading(false);
                return;
            }

            if (selectedDbRole === "provider" && !roles.includes("provider")) {
                setError("Usuário não cadastrado.");
                setLoading(false);
                return;
            }

            if (selectedDbRole === "owner" && !roles.includes("owner")) {
                setPendingOwnerAttach({ email: email.trim(), password, status });
                setLoading(false);
                return;
            }

            await loginWithSelectedRole(email, password, selectedDbRole, status);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Falha ao efetuar login");
            setLoading(false);
        }
    }

    async function sendOtp() {
        setError(null);
        setLoading(true);
        const supabase = createClient();
        const { error: otpError } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: { shouldCreateUser: false },
        });
        setLoading(false);
        if (otpError) {
            setError(otpError.message);
            return;
        }
        setOtpSent(true);
    }

    async function completeOtpPassword(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (newPassword.length < 6) {
            setError("A senha deve ter pelo menos 6 caracteres.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }
        setLoading(true);
        const supabase = createClient();
        const { error: verifyError } = await supabase.auth.verifyOtp({
            email: email.trim(),
            token: otp.trim(),
            type: "email",
        });
        if (verifyError) {
            setError(verifyError.message);
            setLoading(false);
            return;
        }
        const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
        if (pwError) {
            setError(pwError.message);
            setLoading(false);
            return;
        }
        const {
            data: { user: uAfter },
        } = await supabase.auth.getUser();
        if (uAfter) {
            const { data: prof } = await supabase
                .from("profiles")
                .select("is_active")
                .eq("id", uAfter.id)
                .maybeSingle();
            if (prof?.is_active === false) {
                await supabase.auth.signOut();
                setError(INACTIVE_LOGIN_MESSAGE);
                setLoading(false);
                return;
            }
        }
        try {
            await activateRole(roleToDb(role));
            pushAfterActivate();
            setLoading(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Falha ao ativar tipo de conta");
            setLoading(false);
        }
    }

    async function confirmOwnerAttach() {
        if (!pendingOwnerAttach) return;
        setError(null);
        setLoading(true);
        try {
            await loginWithSelectedRole(
                pendingOwnerAttach.email,
                pendingOwnerAttach.password,
                "owner",
                pendingOwnerAttach.status,
            );
            setPendingOwnerAttach(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Falha ao ativar conta de Empresário");
            setLoading(false);
        }
    }

    return (
        <div className="relative flex w-full shrink-0 flex-col justify-start bg-bg-primary px-5 pb-[max(2.75rem,env(safe-area-inset-bottom)+0.5rem)] pt-6 sm:px-6 sm:pb-12 sm:pt-10 md:px-12 md:pt-12 lg:bg-bg-secondary/40 lg:px-16 lg:pt-14 lg:pb-16">
            {pendingOwnerAttach ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
                    role="presentation"
                    onClick={() => setPendingOwnerAttach(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="owner-register-title"
                        className="w-full max-w-md rounded-2xl border border-border bg-bg-card p-6 shadow-xl"
                        onClick={(ev) => ev.stopPropagation()}
                    >
                        <h3 id="owner-register-title" className="font-serif text-lg font-medium text-text-primary">
                            Conta Empresário
                        </h3>
                        <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
                            Usuário não cadastrado como Empresário. Deseja realizar esse cadastro no mesmo login?
                        </p>
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                className="min-h-[44px] rounded-xl border border-border px-4 py-2.5 text-[15px] font-medium text-text-primary transition hover:bg-bg-primary"
                                onClick={() => setPendingOwnerAttach(null)}
                            >
                                Não
                            </button>
                            <button
                                type="button"
                                className="min-h-[44px] rounded-xl border border-gold bg-gold/15 px-4 py-2.5 text-[15px] font-medium text-gold transition hover:bg-gold/25 disabled:opacity-60"
                                onClick={() => void confirmOwnerAttach()}
                                disabled={loading}
                            >
                                {loading ? "Aplicando..." : "Sim"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
            <div className="mx-auto w-full max-w-xl animate-fade-in">
                <h2 className="font-serif text-[1.65rem] font-medium leading-tight tracking-tight text-text-primary sm:text-3xl sm:leading-snug md:text-4xl">
                    Bem-vindo de volta
                </h2>
                <p className="mt-2.5 max-w-[28ch] text-[15px] leading-relaxed text-text-secondary sm:mt-3 sm:max-w-none sm:text-base">
                    Entre na sua conta para continuar no Linkora.
                </p>

                {passwordSetupMode ? (
                    <div className="mt-7 space-y-4 sm:mt-10">
                        <div className="rounded-xl border border-gold/40 bg-bg-card/80 p-4 text-sm text-text-secondary">
                            Conta criada com Google? Defina sua senha aqui. Envie um código por e-mail e crie
                            sua senha para entrar com e-mail e senha daqui em diante.
                        </div>
                        {!otpSent ? (
                            <button
                                type="button"
                                onClick={() => void sendOtp()}
                                disabled={loading}
                                className="w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-[15px] font-medium text-text-primary transition hover:border-gold disabled:opacity-60"
                            >
                                {loading ? "Enviando…" : "Enviar código por e-mail"}
                            </button>
                        ) : null}
                        {otpSent ? (
                            <form className="flex flex-col gap-4" onSubmit={(e) => void completeOtpPassword(e)}>
                                <div>
                                    <label htmlFor="otp" className="mb-2 block text-sm font-medium text-text-secondary">
                                        Código do e-mail
                                    </label>
                                    <input
                                        id="otp"
                                        value={otp}
                                        onChange={(ev) => setOtp(ev.target.value)}
                                        autoComplete="one-time-code"
                                        className="min-h-[48px] w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-base text-text-primary outline-none transition placeholder:text-text-muted focus:border-gold"
                                        placeholder="000000"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="npw" className="mb-2 block text-sm font-medium text-text-secondary">
                                        Nova senha
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="npw"
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(ev) => setNewPassword(ev.target.value)}
                                            autoComplete="new-password"
                                            className="min-h-[48px] w-full rounded-xl border border-border bg-bg-card px-4 py-3 pr-12 text-base text-text-primary outline-none transition placeholder:text-text-muted focus:border-gold"
                                        />
                                        <button
                                            type="button"
                                            aria-label={showNewPassword ? "Ocultar senha" : "Mostrar senha"}
                                            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-text-muted hover:bg-bg-primary hover:text-gold"
                                            onClick={() => setShowNewPassword((s) => !s)}
                                        >
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                                                <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="cpw" className="mb-2 block text-sm font-medium text-text-secondary">
                                        Confirmar senha
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="cpw"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(ev) => setConfirmPassword(ev.target.value)}
                                            autoComplete="new-password"
                                            className="min-h-[48px] w-full rounded-xl border border-border bg-bg-card px-4 py-3 pr-12 text-base text-text-primary outline-none transition placeholder:text-text-muted focus:border-gold"
                                        />
                                        <button
                                            type="button"
                                            aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                                            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-text-muted hover:bg-bg-primary hover:text-gold"
                                            onClick={() => setShowConfirmPassword((s) => !s)}
                                        >
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                                                <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <Button type="submit" variant="gold" className="min-h-[48px] w-full py-3.5" disabled={loading}>
                                    {loading ? "Salvando…" : "Definir senha e entrar"}
                                </Button>
                            </form>
                        ) : null}
                        <button
                            type="button"
                            className="text-sm text-text-muted underline hover:text-gold"
                            onClick={() => {
                                setPasswordSetupMode(false);
                                setOtpSent(false);
                                setOtp("");
                                setNewPassword("");
                                setConfirmPassword("");
                            }}
                        >
                            Voltar ao login
                        </button>
                    </div>
                ) : (
                    <form
                        className="mt-7 flex flex-col gap-4 sm:mt-10 sm:gap-5"
                        noValidate
                        onSubmit={(e) => void handleEmailLogin(e)}
                    >
                        <fieldset className="space-y-3">
                            <legend className="mb-1 text-sm font-medium text-text-secondary">
                                Entrar como
                            </legend>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => setRole("provider")}
                                    className={`rounded-xl border p-4 text-left transition ${role === "provider"
                                        ? "border-green-light bg-[rgba(46,125,82,0.12)]"
                                        : "border-border bg-bg-card hover:border-green-light/50"
                                        }`}
                                >
                                    <span className="mb-1 block text-base font-medium text-green-light">
                                        Prestador
                                    </span>
                                    <span className="text-[13px] leading-snug text-text-secondary">
                                        Oferecer serviços e portfólio.
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole("business")}
                                    className={`rounded-xl border p-4 text-left transition ${role === "business"
                                        ? "border-gold bg-[rgba(201,168,76,0.1)]"
                                        : "border-border bg-bg-card hover:border-gold/50"
                                        }`}
                                >
                                    <span className="mb-1 block text-base font-medium text-gold">Empresário</span>
                                    <span className="text-[13px] leading-snug text-text-secondary">
                                        Contratar profissionais e fornecedores.
                                    </span>
                                </button>
                            </div>
                        </fieldset>
                        <div>
                            <label htmlFor="email" className="mb-2 block text-sm font-medium text-text-secondary">
                                E-mail
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(ev) => setEmail(ev.target.value)}
                                placeholder="voce@exemplo.com"
                                className="min-h-[48px] w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-base text-text-primary outline-none ring-0 transition placeholder:text-text-muted focus:border-gold"
                            />
                        </div>
                        <div>
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <label htmlFor="password" className="text-sm font-medium text-text-secondary">
                                    Senha
                                </label>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(ev) => setPassword(ev.target.value)}
                                    placeholder="••••••••"
                                    className="min-h-[48px] w-full rounded-xl border border-border bg-bg-card px-4 py-3 pr-12 text-base text-text-primary outline-none transition placeholder:text-text-muted focus:border-gold"
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
                        <Button type="submit" variant="gold" className="mt-1 min-h-[48px] w-full py-3.5" disabled={loading}>
                            {loading ? "Entrando…" : "Entrar"}
                        </Button>
                    </form>
                )}

                <div className="relative my-8 sm:my-10">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wider">
                        <span className="bg-bg-primary px-4 text-text-muted lg:bg-bg-secondary/40">ou</span>
                    </div>
                </div>

                <GoogleLoginButton nextPath="/" />

                <p className="mt-8 text-center text-sm text-text-muted sm:mt-10">
                    Ainda não tem conta?{" "}
                    <Link href="/register" className="font-medium text-gold transition hover:text-gold-light">
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
