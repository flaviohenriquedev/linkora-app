"use client";

import {useEffect, useState} from "react";
import {Button} from "@/components/ui/Button";

type Category = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
};

export function CategoriesManager() {
    const [items, setItems] = useState<Category[]>([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function load() {
        const res = await fetch("/api/admin/categories", {cache: "no-store"});
        const json = (await res.json()) as { categories?: Category[]; error?: string };
        if (!res.ok) {
            setError(json.error ?? "Erro ao carregar categorias");
            return;
        }
        setItems(json.categories ?? []);
    }

    useEffect(() => {
        void load();
    }, []);

    async function createCategory() {
        setError(null);
        if (!name.trim()) return;
        setLoading(true);
        const res = await fetch("/api/admin/categories", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({name, description}),
        });
        const json = (await res.json()) as { error?: string };
        setLoading(false);
        if (!res.ok) {
            setError(json.error ?? "Erro ao criar categoria");
            return;
        }
        setName("");
        setDescription("");
        await load();
    }

    async function toggleActive(item: Category) {
        const res = await fetch(`/api/admin/categories/${item.id}`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({is_active: !item.is_active}),
        });
        if (!res.ok) return;
        await load();
    }

    async function remove(item: Category) {
        const res = await fetch(`/api/admin/categories/${item.id}`, {method: "DELETE"});
        if (!res.ok) return;
        await load();
    }

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-border bg-bg-card p-4">
                <h2 className="mb-3 text-lg text-text-primary">Nova categoria</h2>
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nome da categoria"
                        className="min-h-[44px] rounded-lg border border-border bg-bg-primary px-3 text-text-primary outline-none focus:border-gold"
                    />
                    <input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descrição (opcional)"
                        className="min-h-[44px] rounded-lg border border-border bg-bg-primary px-3 text-text-primary outline-none focus:border-gold"
                    />
                    <Button variant="gold" disabled={loading} onClick={() => void createCategory()}>
                        {loading ? "Salvando..." : "Adicionar"}
                    </Button>
                </div>
                {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
            </div>

            <div className="rounded-xl border border-border bg-bg-card p-4">
                <h2 className="mb-3 text-lg text-text-primary">Categorias</h2>
                <div className="space-y-2">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-bg-primary px-3 py-2"
                        >
                            <div>
                                <p className="font-medium text-text-primary">{item.name}</p>
                                <p className="text-xs text-text-muted">{item.slug}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" onClick={() => void toggleActive(item)}>
                                    {item.is_active ? "Desativar" : "Ativar"}
                                </Button>
                                <Button variant="outline" onClick={() => void remove(item)}>
                                    Excluir
                                </Button>
                            </div>
                        </div>
                    ))}
                    {items.length === 0 ? (
                        <p className="text-sm text-text-muted">Nenhuma categoria cadastrada.</p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
