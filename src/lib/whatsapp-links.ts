/** Texto padrão quando o prestador não cadastra mensagem personalizada (wa.me é gratuito). */
export const DEFAULT_WHATSAPP_OPEN_MESSAGE =
  "Olá! Vi seu perfil na Linkora e gostaria de conversar.";

/**
 * Extrai dígitos; se parecer número BR sem DDI (10–11 dígitos), prefixa 55.
 */
export function normalizeWhatsappDigits(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (!d) return null;
  if (d.length >= 10 && d.length <= 11 && !d.startsWith("55")) {
    d = `55${d}`;
  }
  if (d.length < 10 || d.length > 15) return null;
  return d;
}

export function buildWhatsAppChatUrl(phoneDigits: string, openMessage?: string | null): string {
  const base = `https://wa.me/${phoneDigits}`;
  const text = (openMessage?.trim() || DEFAULT_WHATSAPP_OPEN_MESSAGE).trim();
  return `${base}?text=${encodeURIComponent(text)}`;
}
