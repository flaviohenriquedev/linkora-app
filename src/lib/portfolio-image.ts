/** Margem abaixo do limite da API (`/api/files/upload`: 5 MB para imagens). */
const TARGET_MAX_BYTES = Math.floor(4.6 * 1024 * 1024);
const INITIAL_MAX_LONG_EDGE = 2560;
const MIN_LONG_EDGE = 720;

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem."));
    };
    img.src = url;
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falha ao gerar JPEG"))),
      "image/jpeg",
      quality,
    );
  });
}

/**
 * Garante JPEG abaixo do limite de upload, redimensionando e/ou reduzindo qualidade.
 * Evita erro "Arquivo muito grande" após recorte em fotos de alta resolução.
 */
export async function ensureJpegUnderPortfolioUploadLimit(blob: Blob): Promise<Blob> {
  if (blob.size <= TARGET_MAX_BYTES) return blob;

  const img = await loadImageFromBlob(blob);
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!nw || !nh) throw new Error("Dimensões da imagem inválidas.");

  const longEdge = Math.max(nw, nh);
  let scale = Math.min(1, INITIAL_MAX_LONG_EDGE / longEdge);
  let w = Math.max(1, Math.round(nw * scale));
  let h = Math.max(1, Math.round(nh * scale));

  const canvas = document.createElement("canvas");

  const draw = () => {
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Seu navegador não suporta processamento da imagem.");
    ctx.drawImage(img, 0, 0, w, h);
  };
  draw();

  const qualities = [0.88, 0.8, 0.72, 0.64, 0.56, 0.5, 0.45, 0.4, 0.35];

  for (let round = 0; round < 14; round++) {
    for (const q of qualities) {
      const out = await canvasToJpeg(canvas, q);
      if (out.size <= TARGET_MAX_BYTES) return out;
    }
    const nextW = Math.round(w * 0.85);
    const nextH = Math.round(h * 0.85);
    if (Math.max(nextW, nextH) < MIN_LONG_EDGE) break;
    w = Math.max(1, nextW);
    h = Math.max(1, nextH);
    draw();
  }

  const last = await canvasToJpeg(canvas, 0.32);
  if (last.size > TARGET_MAX_BYTES) {
    throw new Error(
      "Esta foto continua muito pesada mesmo após compressão. Tente uma imagem menor ou com menos detalhes.",
    );
  }
  return last;
}
