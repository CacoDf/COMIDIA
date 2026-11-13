import type { Food, Portion } from '../domain/types';

const OFF_BASE = 'https://world.openfoodfacts.org';
const OFF_SEARCH = 'https://search.openfoodfacts.org/search';
const FIELDS = 'code,product_name,brands,nutriments,serving_quantity';

export type OffErrorKind = 'offline' | 'rate-limit' | 'unknown';

export class OffError extends Error {
  kind: OffErrorKind;
  constructor(kind: OffErrorKind, message?: string) {
    super(message ?? kind);
    this.name = 'OffError';
    this.kind = kind;
  }
}

function num(v: unknown): number | undefined {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Convierte un producto de Open Food Facts. Devuelve null si le falta el nombre o algún valor por 100 g. */
export function toFood(raw: unknown): Food | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const p = raw as Record<string, unknown>;
  const code = typeof p.code === 'string' ? p.code : undefined;
  const name = typeof p.product_name === 'string' ? p.product_name.trim() : '';
  const n = (p.nutriments ?? {}) as Record<string, unknown>;
  const kj = num(n.energy_100g);
  const kcal = num(n['energy-kcal_100g']) ?? (kj !== undefined ? kj / 4.184 : undefined);
  const protein = num(n.proteins_100g);
  const carbs = num(n.carbohydrates_100g);
  const fat = num(n.fat_100g);
  if (!code || !name || kcal === undefined || protein === undefined || carbs === undefined || fat === undefined) {
    return null;
  }
  const brandRaw = Array.isArray(p.brands) ? p.brands[0] : p.brands;
  const brand = typeof brandRaw === 'string' && brandRaw.trim() ? brandRaw.split(',')[0].trim() : undefined;
  const portions: Portion[] = [{ label: '100 g', grams: 100 }];
  const serving = num(p.serving_quantity);
  if (serving && serving > 0) portions.push({ label: 'Porción', grams: serving });
  return {
    id: `off:${code}`,
    name,
    ...(brand ? { brand } : {}),
    barcode: code,
    per100: { kcal: Math.round(kcal * 10) / 10, protein, carbs, fat },
    portions,
    source: 'off',
    updatedAt: Date.now(),
  };
}

async function get(url: string): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new OffError('offline', String(e));
  }
  if (res.status === 429) throw new OffError('rate-limit');
  return res;
}

export async function fetchProduct(barcode: string): Promise<Food | null> {
  const res = await get(`${OFF_BASE}/api/v2/product/${encodeURIComponent(barcode)}?fields=${FIELDS}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new OffError('unknown', `HTTP ${res.status}`);
  const body = (await res.json()) as { status?: number; product?: unknown };
  if (body.status !== 1 || !body.product) return null;
  return toFood(body.product);
}

export async function searchProducts(query: string): Promise<Food[]> {
  const res = await get(`${OFF_SEARCH}?q=${encodeURIComponent(query)}&page_size=30&fields=${FIELDS}`);
  if (!res.ok) throw new OffError('unknown', `HTTP ${res.status}`);
  const body = (await res.json()) as { hits?: unknown[]; products?: unknown[] };
  return (body.hits ?? body.products ?? []).map(toFood).filter((f): f is Food => f !== null);
}
