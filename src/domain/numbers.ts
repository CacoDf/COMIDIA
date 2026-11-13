/** Acepta "72,5" o "72.5" (un solo separador decimal). Devuelve null si no es un número no negativo. */
export function parseDecimal(text: string): number | null {
  const t = text.trim();
  if (!/^\d+([.,]\d+)?$/.test(t)) return null;
  return Number(t.replace(',', '.'));
}
