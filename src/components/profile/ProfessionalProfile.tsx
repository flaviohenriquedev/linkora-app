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

const TABS = [
  { id: "about", label: "Sobre" },
  { id: "services", label: "Serviços" },
  { id: "portfolio", label: "Portfólio" },
  { id: "reviews", label: "Avaliações" },
] as const;

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return (p[0]![0] + p[p.length - 1]![0]).toUpperCase();
}

export function ProfessionalProfile() {
  const { profile, avatarUrl, refresh, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("about");

  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
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
    setCategoryId(profile.category_id ?? null);
  }, [profile]);

  useEffect(() => {
    void fetch("/api/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { categories?: CategoryOption[] }) => setCategories(d.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

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
        category_id: categoryId,
      }),
    });
    if (!res.ok) {
      setSaveState("error");
      return;
    }
    setSaveState("saved");
    await refresh();
    setTimeout(() => setSaveState("idle"), 2000);
  }, [fullName, headline, bio, city, categoryId, refresh]);

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

  if (authLoading && !profile) {
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
            Edite como você aparece para clientes. Use “Salvar alterações” para gravar nome, categoria e
            texto.
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
            <div className="relative h-[112px] w-[112px] overflow-hidden rounded-full border-4 border-bg-card bg-green-main shadow-lg ring-1 ring-white/10">
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
            <Button
              type="button"
              variant="outline"
              className="text-sm"
              disabled={uploadBusy}
              onClick={() => fileRef.current?.click()}
            >
              {uploadBusy ? "Enviando…" : "Alterar foto"}
            </Button>
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
            <CategoryAutocomplete
              id="pf-category"
              label="Categoria (aparece em Explore por categoria)"
              value={categoryId}
              onChange={setCategoryId}
              options={categories}
            />
          </div>
        </div>
      </section>

      <div className="mb-8 flex flex-wrap gap-6 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`border-b-2 pb-3 text-[15px] transition ${
              tab === t.id
                ? "border-gold font-medium text-gold"
                : "border-transparent text-text-secondary hover:text-gold"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "about" && (
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
      )}

      {tab === "services" && (
        <div className="flex flex-col gap-4">
          <p className="text-text-muted">
            Cadastro de serviços e preços virá na próxima etapa; por enquanto use o perfil para validar
            dados básicos e foto.
          </p>
          <div className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-bg-card p-6 opacity-60 sm:flex-row sm:items-center">
            <div>
              <h3 className="mb-1 text-lg">Exemplo: Criação de Coleção</h3>
              <p className="text-sm text-text-secondary">Configure valores e descrições em breve.</p>
            </div>
            <span className="font-medium text-gold">Em breve</span>
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
    </Container>
  );
}
