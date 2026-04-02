"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormSelect } from "@/components/ui/FormSelect";

type Row = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

type Props = {
  initialPage?: number;
};

export function AdminUsersTable({ initialPage = 1 }: Props) {
  const [page, setPage] = useState(initialPage);
  const [draftQ, setDraftQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "provider" | "owner">("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null);

  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      role: roleFilter,
    });
    if (appliedQ.trim()) params.set("q", appliedQ.trim());
    const res = await fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
    const json = (await res.json()) as {
      users?: Row[];
      total?: number;
      totalPages?: number;
      error?: string;
    };
    if (!res.ok) {
      setError(json.error ?? "Falha ao carregar");
      setRows([]);
      setLoading(false);
      return;
    }
    setRows(json.users ?? []);
    setTotal(json.total ?? 0);
    setTotalPages(json.totalPages ?? 1);
    setLoading(false);
  }, [page, appliedQ, roleFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleActive(id: string, next: boolean): Promise<boolean> {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: next }),
    });
    const json = (await res.json()) as { error?: string };
    setBusyId(null);
    if (!res.ok) {
      setError(json.error ?? "Falha ao atualizar");
      return false;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: next } : r)));
    return true;
  }

  function roleLabel(r: string) {
    return r === "provider" ? "Prestador" : "Empresário";
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  }

  return (
    <div className="space-y-4">
      {confirmDeactivateId ? (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={() => setConfirmDeactivateId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-deactivate-user-title"
            className="w-full max-w-md rounded-2xl border border-border bg-bg-card p-6 shadow-xl"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h3 id="admin-deactivate-user-title" className="font-serif text-lg font-medium text-text-primary">
              Inativar usuário
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
              Deseja realmente inativar esse usuário?
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="min-h-[44px]"
                disabled={busyId === confirmDeactivateId}
                onClick={() => setConfirmDeactivateId(null)}
              >
                Cancelar
              </Button>
              <button
                type="button"
                disabled={busyId === confirmDeactivateId}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-red-900/50 px-6 py-2.5 text-[15px] font-medium text-red-300 transition hover:bg-red-950/30 disabled:opacity-50"
                onClick={async () => {
                  if (!confirmDeactivateId) return;
                  const ok = await toggleActive(confirmDeactivateId, false);
                  if (ok) setConfirmDeactivateId(null);
                }}
              >
                {busyId === confirmDeactivateId ? "…" : "Inativar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="admin-user-q" className="mb-1 block text-xs font-medium text-text-muted">
            Buscar por nome ou e-mail
          </label>
          <input
            id="admin-user-q"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setAppliedQ(draftQ.trim());
                setPage(1);
              }
            }}
            placeholder="Digite e pressione Enter"
            className="min-h-[44px] w-full rounded-xl border border-border bg-bg-card px-3 py-2 text-sm text-text-primary outline-none focus:border-gold"
          />
        </div>
        <FormSelect
          id="admin-user-role"
          label="Papel no perfil"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as "all" | "provider" | "owner");
            setPage(1);
          }}
          className="w-full min-w-[10rem] sm:w-auto"
        >
          <option value="all">Todos</option>
          <option value="provider">Prestador</option>
          <option value="owner">Empresário</option>
        </FormSelect>
        <Button
          type="button"
          variant="outline"
          className="min-h-[44px]"
          onClick={() => {
            setAppliedQ(draftQ.trim());
            setPage(1);
          }}
        >
          Buscar
        </Button>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-border bg-bg-card shadow-sm">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-primary/80">
              <th className="px-4 py-3 font-medium text-text-secondary">Nome</th>
              <th className="px-4 py-3 font-medium text-text-secondary">E-mail</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Papel</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Cadastro</th>
              <th className="px-4 py-3 text-right font-medium text-text-secondary">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                  Carregando…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-border/80 hover:bg-bg-primary/40">
                  <td className="px-4 py-3 font-medium text-text-primary">{r.full_name?.trim() || "—"}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-text-secondary">{r.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        r.role === "provider"
                          ? "rounded-full bg-[rgba(46,125,82,0.2)] px-2 py-0.5 text-xs text-green-light"
                          : "rounded-full bg-[rgba(201,168,76,0.15)] px-2 py-0.5 text-xs text-gold"
                      }
                    >
                      {roleLabel(r.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.is_active ? (
                      <span className="text-green-light">Ativo</span>
                    ) : (
                      <span className="text-text-muted">Inativo</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-muted">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {r.is_active ? (
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-950/30 disabled:opacity-50"
                        onClick={() => setConfirmDeactivateId(r.id)}
                      >
                        {busyId === r.id ? "…" : "Desativar"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        className="rounded-lg border border-green-900/50 px-3 py-1.5 text-xs text-green-light transition hover:bg-green-950/30 disabled:opacity-50"
                        onClick={() => void toggleActive(r.id, true)}
                      >
                        {busyId === r.id ? "…" : "Ativar"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-text-muted">
          Mostrando {rows.length ? (page - 1) * pageSize + 1 : 0}–
          {(page - 1) * pageSize + rows.length} de {total}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-9 px-3 py-1.5 text-sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span className="text-sm text-text-secondary">
            Página {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            className="min-h-9 px-3 py-1.5 text-sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
