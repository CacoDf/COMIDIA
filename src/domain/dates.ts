const pad = (n: number) => String(n).padStart(2, '0');

/** Fecha local del teléfono en formato YYYY-MM-DD (nunca UTC). */
export function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayLocal(): string {
  return toLocalDate(new Date());
}

/** Interpreta YYYY-MM-DD como mediodía local para evitar saltos por cambio de horario. */
function parseLocal(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(date: string, n: number): string {
  const d = parseLocal(date);
  d.setDate(d.getDate() + n);
  return toLocalDate(d);
}

export function ageOn(birthDate: string, on: string): number {
  const [by, bm, bd] = birthDate.split('-').map(Number);
  const [y, m, d] = on.split('-').map(Number);
  const hadBirthday = m > bm || (m === bm && d >= bd);
  return y - by - (hadBirthday ? 0 : 1);
}

/** Semana de lunes a domingo que contiene la fecha. */
export function weekRange(date: string): { from: string; to: string } {
  const dow = parseLocal(date).getDay(); // 0 = domingo
  const fromMonday = (dow + 6) % 7;
  const from = addDays(date, -fromMonday);
  return { from, to: addDays(from, 6) };
}
