"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  CategoryAutocomplete,
  type CategoryOption,
} from "@/components/profile/CategoryAutocomplete";
import { AccountDangerZone } from "@/components/profile/AccountDangerZone";
import { FormSelect } from "@/components/ui/FormSelect";
import { formatCentsToBrl, maskBrlFromDigits, parseBrlToCents } from "@/lib/currency";

const TABS = [
  { id: "about", label: "Sobre" },
  { id: "services", label: "Serviços" },
  { id: "portfolio", label: "Portfólio" },
  { id: "reviews", label: "Avaliações" },
] as const;

type ProviderServiceRow = {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  price_cents: number | null;
  sort_order: number;
  is_active: boolean;
  category: { id: string; name: string; slug: string } | null;
};

type ProviderContactRow = {
  id: string;
  type: "email" | "phone" | "whatsapp";
  label: string | null;
  value: string;
  is_public: boolean;
  sort_order: number;
};

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return (p[0]![0] + p[p.length - 1]![0]).toUpperCase();
}

export function ProfessionalProfile() {
  const { profile, avatarUrl, refresh, loading, profileLoading, user } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("about");

  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [services, setServices] = useState<ProviderServiceRow[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategoryId, setNewCategoryId] = useState<string | null>(null);
  const [newDesc, setNewDesc] = useState("");
  const [newPriceMasked, setNewPriceMasked] = useState("");
  const [serviceBusy, setServiceBusy] = useState(false);
  const [contacts, setContacts] = useState<ProviderContactRow[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactBusy, setContactBusy] = useState(false);
  const [newContactType, setNewContactType] = useState<ProviderContactRow["type"]>("whatsapp");
  const [newContactLabel, setNewContactLabel] = useState("");
  const [newContactValue, setNewContactValue] = useState("");
  const [newContactPublic, setNewContactPublic] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editPriceMasked, setEditPriceMasked] = useState("");
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [uploadBusy, setUploadBusy] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setHeadline(profile.headline ?? "");
    setBio(profile.bio ?? "");
    setCity(profile.city ?? "");
  }, [profile]);

  useEffect(() => {
    void fetch("/api/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { categories?: CategoryOption[] }) => setCategories(d.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

  const loadServices = useCallback(async () => {
    setServicesLoading(true);
    try {
      const res = await fetch("/api/profile/services", { cache: "no-store" });
      const d = (await res.json()) as { services?: ProviderServiceRow[] };
      setServices(d.services ?? []);
    } catch {
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  }, []);

  const loadContacts = useCallback(async () => {
    setContactsLoading(true);
    try {
      const res = await fetch("/api/profile/contacts", { cache: "no-store" });
      const d = (await res.json()) as { contacts?: ProviderContactRow[] };
      setContacts(d.contacts ?? []);
    } catch {
      setContacts([]);
    } finally {
      setContactsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!profile) return;
    void loadServices();
    void loadContacts();
  }, [profile, loadServices, loadContacts]);

  useEffect(() => {
    setLocalAvatarUrl(avatarUrl);
  }, [avatarUrl]);

  useEffect(() => {
    return () => {
      if (sourceImage) URL.revokeObjectURL(sourceImage);
    };
  }, [sourceImage]);

  const displayName = fullName.trim() || "Seu nome";
  const av = localAvatarUrl;

  const saveProfile = useCallback(async () => {
    setSaveState("saving");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        headline: headline || null,
        bio: bio || null,
        city: city || null,
      }),
    });
    if (!res.ok) {
      setSaveState("error");
      return;
    }
    setSaveState("saved");
    await refresh();
    setTimeout(() => setSaveState("idle"), 2000);
  }, [fullName, headline, bio, city, refresh]);

  async function addService() {
    if (!newCategoryId) return;
    setServiceBusy(true);
    try {
      const priceCents = parseBrlToCents(newPriceMasked);
      const res = await fetch("/api/profile/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: newCategoryId,
          title: newTitle.trim() || "Novo serviço",
          description: newDesc.trim() || null,
          price_cents: priceCents,
        }),
      });
      if (!res.ok) return;
      setNewTitle("");
      setNewDesc("");
      setNewPriceMasked("");
      setNewCategoryId(null);
      await loadServices();
    } finally {
      setServiceBusy(false);
    }
  }

  async function deleteService(id: string) {
    if (typeof window !== "undefined" && !window.confirm("Excluir este serviço?")) return;
    setServiceBusy(true);
    try {
      await fetch(`/api/profile/services/${id}`, { method: "DELETE" });
      await loadServices();
      if (editingId === id) setEditingId(null);
    } finally {
      setServiceBusy(false);
    }
  }

  async function addContact() {
    if (!newContactValue.trim()) return;
    setContactBusy(true);
    try {
      const res = await fetch("/api/profile/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newContactType,
          label: newContactLabel.trim() || null,
          value: newContactValue.trim(),
          is_public: newContactPublic,
          sort_order: contacts.length,
        }),
      });
      if (!res.ok) return;
      setNewContactLabel("");
      setNewContactValue("");
      setNewContactPublic(true);
      setNewContactType("whatsapp");
      await loadContacts();
    } finally {
      setContactBusy(false);
    }
  }

  async function removeContact(id: string) {
    setContactBusy(true);
    try {
      await fetch(`/api/profile/contacts/${id}`, { method: "DELETE" });
      await loadContacts();
    } finally {
      setContactBusy(false);
    }
  }

  function startEdit(s: ProviderServiceRow) {
    setEditingId(s.id);
    setEditTitle(s.title);
    setEditCategoryId(s.category_id);
    setEditDesc(s.description ?? "");
    setEditPriceMasked(s.price_cents != null ? formatCentsToBrl(s.price_cents) : "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!editingId || !editCategoryId) return;
    setServiceBusy(true);
    try {
      const priceCents = parseBrlToCents(editPriceMasked);
      const res = await fetch(`/api/profile/services/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim() || "Serviço",
          description: editDesc.trim() || null,
          category_id: editCategoryId,
          price_cents: priceCents,
        }),
      });
      if (!res.ok) return;
      setEditingId(null);
      await loadServices();
    } finally {
      setServiceBusy(false);
    }
  }

  function onCropComplete(_: Area, areaPixels: Area) {
    setCroppedAreaPixels(areaPixels);
  }

  async function getCroppedBlob(imageSrc: string, area: Area): Promise<Blob> {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageSrc;
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(area.width);
    canvas.height = Math.round(area.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível");

    ctx.drawImage(
      image,
      area.x,
      area.y,
      area.width,
      area.height,
      0,
      0,
      area.width,
      area.height,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );
    if (!blob) throw new Error("Falha ao gerar imagem recortada");
    return blob;
  }

  async function onPickAvatar(file: File | undefined) {
    if (!file) return;
    if (sourceImage) URL.revokeObjectURL(sourceImage);
    setSourceImage(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }

  async function removeAvatar() {
    setUploadBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_file_id: null }),
      });
      if (!res.ok) throw new Error("Não foi possível remover a foto");
      setLocalAvatarUrl(null);
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setUploadBusy(false);
    }
  }

  async function confirmCropAndUpload() {
    if (!sourceImage || !croppedAreaPixels) return;
    setUploadBusy(true);
    try {
      const blob = await getCroppedBlob(sourceImage, croppedAreaPixels);
      const fd = new FormData();
      fd.append("file", new File([blob], "avatar.jpg", { type: "image/jpeg" }));
      fd.append("purpose", "profile_avatar");

      const res = await fetch("/api/files/upload", { method: "POST", body: fd });
      const json = (await res.json()) as {
        file?: { id: string };
        signedUrl?: string | null;
        error?: string;
      };
      if (!res.ok || !json.file?.id) throw new Error(json.error ?? "Falha no upload");

      const patch = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_file_id: json.file.id }),
      });
      if (!patch.ok) throw new Error("Não foi possível associar a foto ao perfil");

      await refresh();
      if (json.signedUrl) setLocalAvatarUrl(json.signedUrl);
      URL.revokeObjectURL(sourceImage);
      setSourceImage(null);
    } catch (e) {
      console.error(e);
    } finally {
      setUploadBusy(false);
    }
  }

  if ((loading && !user) || (user && profileLoading && !profile)) {
    return (
      <Container className="py-10">
        <p className="text-text-secondary">Carregando perfil…</p>
      </Container>
    );
  }

  return (
    <Container className="min-w-0 py-8 sm:py-10">
      {sourceImage ? (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-bg-card p-4">
            <h3 className="mb-3 text-base font-medium text-text-primary">Ajustar foto de perfil</h3>
            <div className="relative h-[340px] w-full overflow-hidden rounded-xl bg-black/70">
              <Cropper
                image={sourceImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-xs text-text-muted">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-gold"
              />
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (sourceImage) URL.revokeObjectURL(sourceImage);
                  setSourceImage(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="button" variant="gold" onClick={() => void confirmCropAndUpload()}>
                Salvar foto
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-stretch sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl text-text-primary sm:text-3xl">Meu perfil profissional</h1>
          <p className="mt-1 max-w-xl text-sm text-text-secondary">
            Edite como você aparece para clientes. Use “Salvar alterações” para gravar nome e texto; em
            Serviços, cadastre categorias por oferta.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Button
            type="button"
            variant="gold"
            className="min-h-[44px] w-full sm:w-auto"
            disabled={saveState === "saving"}
            onClick={() => void saveProfile()}
          >
            {saveState === "saving" ? "Salvando…" : saveState === "saved" ? "Salvo" : "Salvar alterações"}
          </Button>
          {saveState === "error" ? (
            <span className="text-sm text-red-400">Não foi possível salvar.</span>
          ) : null}
        </div>
      </div>

      <section className="mb-8 rounded-2xl border border-border bg-bg-card shadow-sm">
        <div className="h-[96px] overflow-hidden rounded-t-2xl bg-gradient-to-r from-bg-secondary via-green-main/80 to-bg-secondary sm:h-[120px]" />
        <div className="relative flex flex-col gap-8 px-4 pb-8 pt-0 sm:px-8 lg:flex-row lg:items-start lg:gap-10 lg:px-10">
          <div className="-mt-12 flex shrink-0 flex-col items-center gap-3 sm:items-start">
            <div className="relative h-[112px] w-[112px]">
              <div className="h-full w-full overflow-hidden rounded-full border-4 border-bg-card bg-green-main shadow-lg ring-1 ring-white/10">
                {av ? (
                  // eslint-disable-next-line @next/next/no-img-element -- URL assinada do Storage
                  <img src={av} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-serif text-3xl font-semibold text-white">
                    {initials(displayName)}
                  </span>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => void onPickAvatar(e.target.files?.[0])}
              />
              <button
                type="button"
                aria-label="Alterar foto de perfil"
                disabled={uploadBusy}
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-bg-card bg-bg-secondary text-gold shadow-md transition hover:bg-bg-primary disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
            </div>
            {av ? (
              <button
                type="button"
                disabled={uploadBusy}
                onClick={() => void removeAvatar()}
                className="w-full text-sm text-text-muted underline-offset-2 transition hover:text-gold hover:underline disabled:opacity-50"
              >
                Remover foto
              </button>
            ) : null}
          </div>

          <div className="min-w-0 flex-1 space-y-5 pt-2 lg:pt-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted" htmlFor="pf-name">
                Nome público
              </label>
              <input
                id="pf-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2.5 font-serif text-xl text-text-primary outline-none transition focus:border-gold focus:ring-1 focus:ring-gold/25 sm:text-2xl"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted" htmlFor="pf-headline">
                  Título / especialidade
                </label>
                <input
                  id="pf-headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Ex.: Estilista"
                  className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-gold focus:ring-1 focus:ring-gold/25"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted" htmlFor="pf-city">
                  Cidade
                </label>
                <input
                  id="pf-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Cidade, UF"
                  className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-gold focus:ring-1 focus:ring-gold/25"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-8 flex flex-wrap gap-6 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex min-h-[44px] items-center border-b-2 pb-3 text-[15px] transition ${tab === t.id
              ? "border-gold font-medium text-gold"
              : "border-transparent text-text-secondary hover:text-gold"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "about" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-bg-card/50 p-4 sm:p-6">
            <h2 className="mb-3 text-lg font-medium text-text-primary">Sobre mim</h2>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={8}
              className="w-full max-w-3xl rounded-lg border border-border bg-bg-primary px-4 py-3 text-sm leading-relaxed text-text-secondary outline-none transition focus:border-gold focus:ring-1 focus:ring-gold/20"
              placeholder="Conte sua experiência, estilo de trabalho e diferenciais."
            />
          </div>

          <div className="rounded-xl border border-border bg-bg-card/50 p-4 sm:p-6">
            <h3 className="mb-3 text-lg font-medium text-text-primary">Contatos</h3>
            <p className="mb-4 text-sm text-text-secondary">
              Adicione e-mails, telefones e WhatsApp para aparecer na sua página pública.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormSelect
                id="new-contact-type"
                label="Tipo"
                value={newContactType}
                onChange={(e) => setNewContactType(e.target.value as ProviderContactRow["type"])}
                className="min-w-0"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="phone">Telefone</option>
                <option value="email">E-mail</option>
              </FormSelect>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Rótulo (opcional)</label>
                <input
                  value={newContactLabel}
                  onChange={(e) => setNewContactLabel(e.target.value)}
                  placeholder="Ex.: Comercial"
                  className="min-h-[44px] w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm outline-none focus:border-gold"
                />
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Contato</label>
                <input
                  value={newContactValue}
                  onChange={(e) => setNewContactValue(e.target.value)}
                  placeholder={
                    newContactType === "email"
                      ? "contato@empresa.com"
                      : newContactType === "whatsapp"
                        ? "(11) 99999-9999"
                        : "(11) 3333-3333"
                  }
                  className="min-h-[44px] w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm outline-none focus:border-gold"
                />
              </div>
              <label className="inline-flex min-h-[44px] items-center gap-2 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={newContactPublic}
                  onChange={(e) => setNewContactPublic(e.target.checked)}
                />
                Público
              </label>
            </div>
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                className="min-h-[44px]"
                disabled={contactBusy || !newContactValue.trim()}
                onClick={() => void addContact()}
              >
                {contactBusy ? "Salvando..." : "Adicionar contato"}
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {contactsLoading ? <p className="text-sm text-text-muted">Carregando contatos...</p> : null}
              {!contactsLoading && contacts.length === 0 ? (
                <p className="text-sm text-text-muted">Nenhum contato cadastrado.</p>
              ) : null}
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-bg-primary px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-text-primary">
                      {(c.label?.trim() || c.type).toUpperCase()} - {c.value}
                    </p>
                    <p className="text-xs text-text-muted">{c.is_public ? "Público" : "Privado"}</p>
                  </div>
                  <button
                    type="button"
                    className="self-start rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted transition hover:text-red-400 sm:self-auto"
                    onClick={() => void removeContact(c.id)}
                    disabled={contactBusy}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "services" && (
        <div className="flex flex-col gap-6">
          <p className="text-sm text-text-secondary">
            Cada serviço pode ter uma categoria (Explore e filtros usarão essas categorias). Adicione,
            edite ou remova abaixo.
          </p>

          <div className="rounded-xl border border-border bg-bg-card/50 p-4 sm:p-5">
            <h3 className="mb-3 text-base font-medium text-text-primary">Novo serviço</h3>
            <div className="flex flex-col gap-4">
              <CategoryAutocomplete
                id="svc-new-cat"
                label="Categoria"
                value={newCategoryId}
                onChange={setNewCategoryId}
                options={categories}
              />
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted" htmlFor="svc-new-title">
                  Título
                </label>
                <input
                  id="svc-new-title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex.: Consultoria de coleção"
                  className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2.5 text-sm text-text-primary outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted" htmlFor="svc-new-desc">
                  Descrição (opcional)
                </label>
                <textarea
                  id="svc-new-desc"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2.5 text-sm text-text-secondary outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted" htmlFor="svc-new-price">
                  Valor (opcional)
                </label>
                <input
                  id="svc-new-price"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="R$ 0,00"
                  value={newPriceMasked}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setNewPriceMasked(maskBrlFromDigits(digits));
                  }}
                  className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2.5 text-sm text-text-primary outline-none focus:border-gold"
                />
              </div>
              <Button
                type="button"
                variant="gold"
                className="min-h-[44px] w-full sm:w-auto"
                disabled={serviceBusy || !newCategoryId}
                onClick={() => void addService()}
              >
                {serviceBusy ? "Salvando…" : "Adicionar serviço"}
              </Button>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-base font-medium text-text-primary">Seus serviços</h3>
            {servicesLoading ? (
              <p className="text-sm text-text-muted">Carregando…</p>
            ) : services.length === 0 ? (
              <p className="text-sm text-text-muted">Nenhum serviço ainda. Adicione um acima.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {services.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-xl border border-border bg-bg-card p-4 sm:flex sm:items-start sm:justify-between sm:gap-4"
                  >
                    {editingId === s.id ? (
                      <div className="min-w-0 flex-1 space-y-3">
                        <CategoryAutocomplete
                          id={`svc-edit-cat-${s.id}`}
                          label="Categoria"
                          value={editCategoryId}
                          onChange={setEditCategoryId}
                          options={categories}
                        />
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm"
                        />
                        <textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm"
                        />
                        <div>
                          <label className="mb-1 block text-xs text-text-muted">Valor</label>
                          <input
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="R$ 0,00"
                            value={editPriceMasked}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, "");
                              setEditPriceMasked(maskBrlFromDigits(digits));
                            }}
                            className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="gold"
                            className="min-h-[44px]"
                            disabled={serviceBusy || !editCategoryId}
                            onClick={() => void saveEdit()}
                          >
                            Salvar
                          </Button>
                          <Button type="button" variant="outline" className="min-h-[44px]" onClick={cancelEdit}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-text-primary">{s.title}</p>
                          <p className="mt-1 text-xs text-green-light">
                            {s.category?.name ?? "Categoria"}
                          </p>
                          {s.price_cents != null ? (
                            <p className="mt-1 text-sm font-medium text-gold">
                              R$ {formatCentsToBrl(s.price_cents)}
                            </p>
                          ) : null}
                          {s.description ? (
                            <p className="mt-2 text-sm text-text-secondary">{s.description}</p>
                          ) : null}
                        </div>
                        <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
                          <button
                            type="button"
                            className="min-h-[44px] rounded-lg border border-border px-3 text-sm text-gold transition hover:bg-bg-primary"
                            disabled={serviceBusy}
                            onClick={() => startEdit(s)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="min-h-[44px] rounded-lg border border-border px-3 text-sm text-text-muted transition hover:text-red-400"
                            disabled={serviceBusy}
                            onClick={() => void deleteService(s.id)}
                          >
                            Excluir
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "portfolio" && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-bg-card text-text-muted"
            >
              Portfólio {i} (em breve)
            </div>
          ))}
        </div>
      )}

      {tab === "reviews" && (
        <p className="text-text-muted">Avaliações aparecerão aqui quando a área estiver conectada.</p>
      )}

      <AccountDangerZone />
    </Container>
  );
}
