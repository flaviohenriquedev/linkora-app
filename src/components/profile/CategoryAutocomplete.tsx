"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type CategoryOption = { id: string; name: string; slug: string };

type Props = {
  id: string;
  label: string;
  value: string | null;
  onChange: (id: string | null) => void;
  options: CategoryOption[];
  disabled?: boolean;
};

export function CategoryAutocomplete({
  id,
  label,
  value,
  onChange,
  options,
  disabled,
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  const selected = useMemo(() => options.find((o) => o.id === value) ?? null, [options, value]);

  const updateMenuPos = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setMenuPos({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);

  const openMenu = useCallback(() => {
    updateMenuPos();
    setOpen(true);
  }, [updateMenuPos]);

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    updateMenuPos();
    const onScroll = () => updateMenuPos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, updateMenuPos]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (boxRef.current?.contains(t)) return;
      if ((e.target as HTMLElement).closest("[data-category-listbox]")) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q),
    );
  }, [options, query]);

  const pick = useCallback(
    (opt: CategoryOption) => {
      onChange(opt.id);
      setQuery(opt.name);
      setOpen(false);
    },
    [onChange],
  );

  const clear = useCallback(() => {
    onChange(null);
    setQuery("");
    setOpen(false);
  }, [onChange]);

  const listEl =
    open && !disabled && menuPos ? (
      <ul
        data-category-listbox
        role="listbox"
        className="fixed z-[9999] max-h-56 overflow-auto rounded-lg border border-border bg-bg-card py-1 shadow-2xl ring-1 ring-black/20"
        style={{
          top: menuPos.top,
          left: menuPos.left,
          width: menuPos.width,
        }}
      >
        {filtered.length === 0 ? (
          <li className="px-3 py-2 text-sm text-text-muted">Nenhuma categoria encontrada</li>
        ) : (
          filtered.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                role="option"
                className="w-full px-3 py-2.5 text-left text-sm text-text-primary hover:bg-bg-primary"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(opt)}
              >
                {opt.name}
              </button>
            </li>
          ))
        )}
      </ul>
    ) : null;

  return (
    <div ref={boxRef} className="relative w-full">
      <label className="mb-1.5 block text-xs font-medium text-text-muted" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          disabled={disabled}
          value={open ? query : (selected?.name ?? "")}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            openMenu();
            if (!v.trim()) onChange(null);
          }}
          onFocus={() => {
            setQuery(selected?.name ?? "");
            openMenu();
          }}
          placeholder="Digite para buscar…"
          className="w-full rounded-lg border border-border bg-bg-primary py-2.5 pl-3 pr-16 text-sm text-text-primary outline-none ring-0 transition focus:border-gold focus:ring-1 focus:ring-gold/30"
        />
        {value ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-gold"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => clear()}
          >
            Limpar
          </button>
        ) : null}
      </div>
      {typeof document !== "undefined" && listEl ? createPortal(listEl, document.body) : null}
    </div>
  );
}
