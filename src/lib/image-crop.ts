import type { Area } from "react-easy-crop";

export async function getCroppedImageBlob(imageSrc: string, area: Area, mime: "image/jpeg" | "image/png" = "image/jpeg"): Promise<Blob> {
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

  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);

  const quality = mime === "image/jpeg" ? 0.92 : undefined;
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, quality));
  if (!blob) throw new Error("Falha ao gerar imagem recortada");
  return blob;
}
