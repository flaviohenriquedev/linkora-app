"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";

export function AccountDangerZone() {
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deactivate() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("request_account_deactivation");
    if (rpcError) {
      setError(rpcError.message);
      setBusy(false);
      return;
    }
    setOpen(false);
    await signOut();
  }

  return (
    <div className="mt-10 rounded-2xl border border-red-900/40 bg-[rgba(80,20,20,0.12)] p-5 sm:p-6">
      <h3 className="font-serif text-lg text-text-primary">Conta e privacidade</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        Desativar sua conta oculta seu perfil de buscas públicas e encerra o acesso ao Linkora. Seus dados
        permanecem armazenados; um administrador pode reativar a conta se necessário.
      </p>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      {!open ? (
        <Button
          type="button"
          variant="outline"
          className="mt-4 border-red-900/50 text-red-300 hover:border-red-400 hover:bg-red-950/30 hover:text-red-200"
          onClick={() => setOpen(true)}
        >
          Desativar minha conta
        </Button>
      ) : (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-text-secondary">Confirma a desativação?</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-red-800 text-red-300 hover:bg-red-950/40"
              disabled={busy}
              onClick={() => void deactivate()}
            >
              {busy ? "Processando…" : "Sim, desativar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
