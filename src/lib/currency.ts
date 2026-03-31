/** Formata centavos para exibição BRL (ex.: 12345 -> "123,45"). */
export function formatCentsToBrl(cents: number | null | undefined): string {
  if (cents == null || !Number.isFinite(cents)) return "";
  const v = Math.max(0, Math.round(cents));
  const reais = Math.floor(v / 100);
  const c = v % 100;
  return `${reais.toLocaleString("pt-BR")},${c.toString().padStart(2, "0")}`;
}

/** A partir de dígitos digitados (só números), monta string R$ 0,00 para o input. */
export function maskBrlFromDigits(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (!d) return "";
  const cents = Math.min(parseInt(d, 10) || 0, 999_999_999_99); // teto razoável
  const reais = Math.floor(cents / 100);
  const c = cents % 100;
  const reaisStr = reais.toLocaleString("pt-BR");
  return `${reaisStr},${c.toString().padStart(2, "0")}`;
}

/** Converte string mascarada "1.234,56" ou dígitos para centavos. */
export function parseBrlToCents(input: string): number | null {
  const t = input.trim();
  if (!t) return null;
  const normalized = t.replace(/\./g, "").replace(",", ".");
  const n = Number.parseFloat(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}
