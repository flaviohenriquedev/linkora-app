"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/Button";
import { getCroppedImageBlob } from "@/lib/image-crop";
import type { PortfolioCropAspect, PortfolioCropAspectOption } from "@/lib/portfolio-crop-aspect";

/** Re-export para o portfólio (inclui `cropKey` para persistir na API). */
export { PORTFOLIO_CROP_ASPECT_OPTIONS } from "@/lib/portfolio-crop-aspect";

type Props = {
  imageSrc: string | null;
  title: string;
  cropShape?: "rect" | "round";
  showGrid?: boolean;
  /** Área do recorte: classes Tailwind para altura (ex. avatar fixo, portfólio mais alto). */
  cropFrameClassName?: string;
  /** Sem isto: usa `fixedAspect` (só avatar / casos simples). Com isto: mostra botões de proporção. */
  aspectOptions?: readonly PortfolioCropAspectOption[];
  /** Quando `aspectOptions` não é passado. Default 1. */
  fixedAspect?: number;
  children?: ReactNode;
  confirmLabel: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (
    blob: Blob,
    meta?: { crop_aspect: PortfolioCropAspect },
  ) => void | Promise<void>;
};

export function ImageCropModal({
  imageSrc,
  title,
  cropShape = "rect",
  showGrid = true,
  cropFrameClassName = "h-[340px]",
  aspectOptions,
  fixedAspect = 1,
  children,
  confirmLabel,
  busy = false,
  onClose,
  onConfirm,
}: Props) {
  const firstPortfolioId = aspectOptions?.[0]?.id ?? "";
  const [activeOptionId, setActiveOptionId] = useState(firstPortfolioId);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const selectedPortfolio =
    aspectOptions?.find((o) => o.id === activeOptionId) ?? aspectOptions?.[0];
  const aspect = aspectOptions ? (selectedPortfolio?.aspect ?? 1) : fixedAspect;

  useEffect(() => {
    if (!imageSrc) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    if (aspectOptions?.[0]?.id) setActiveOptionId(aspectOptions[0].id);
  }, [imageSrc, aspectOptions]);

  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, [activeOptionId]);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function handleConfirm() {
    if (!imageSrc || !croppedAreaPixels) return;
    const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, "image/jpeg");
    if (aspectOptions && selectedPortfolio) {
      await onConfirm(blob, { crop_aspect: selectedPortfolio.cropKey });
    } else {
      await onConfirm(blob);
    }
  }

  if (!imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[95dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-bg-card p-4 sm:max-w-lg">
        <h3 className="mb-3 text-base font-medium text-text-primary">{title}</h3>

        {aspectOptions?.length ? (
          <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Proporção do recorte">
            {aspectOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={busy}
                onClick={() => setActiveOptionId(opt.id)}
                className={`min-h-[40px] rounded-lg border px-3 text-sm font-medium transition ${
                  activeOptionId === opt.id
                    ? "border-gold bg-gold/15 text-gold"
                    : "border-border text-text-secondary hover:border-gold/50 hover:text-text-primary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : null}

        <div
          className={`relative w-full overflow-hidden rounded-xl bg-black/70 ${cropFrameClassName}`}
          key={aspect}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={showGrid}
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

        {children}

        <div className="mt-4 flex justify-end gap-3">
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="gold"
            disabled={busy || !croppedAreaPixels}
            onClick={() => void handleConfirm()}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
