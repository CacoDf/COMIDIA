import { resetDb } from '../db/db';
import { upsertFood } from '../db/repo';
import { searchLocal, searchOnline } from './foodSearch';
import type { Food } from '../domain/types';

const m = { kcal: 100, protein: 1, carbs: 2, fat: 3 };
const custom = (over: Partial<Food>): Food => ({
  id: 'c1', name: 'Plátano', per100: m, portions: [{ label: '100 g', grams: 100 }], source: 'custom', updatedAt: 1, ...over,
});

beforeEach(async () => {
  await resetDb();
  vi.unstubAllGlobals();
});

test('encuentra genéricos sin tildes', async () => {
  const r = await searchLocal('platano');
  expect(r.some((f) => f.name === 'Plátano' && f.source === 'generic')).toBe(true);
});

test('coincide por palabras en cualquier orden', async () => {
  const r = await searchLocal('pollo pechuga');
  expect(r.map((f) => f.name)).toContain('Pechuga de pollo cocida');
});

test('un alimento propio aparece antes que un genérico', async () => {
  await upsertFood(custom({}));
  const r = await searchLocal('platano');
  expect(r[0]).toMatchObject({ id: 'c1', source: 'custom' });
  expect(r.some((f) => f.source === 'generic')).toBe(true);
});

test('máximo 30 resultados', async () => {
  expect((await searchLocal('a')).length).toBeLessThanOrEqual(30);
});

test('consulta vacía no devuelve nada', async () => {
  expect(await searchLocal('   ')).toEqual([]);
});

test('searchOnline no repite un producto ya guardado', async () => {
  await upsertFood(custom({ id: 'off:1', barcode: '1', name: 'Leche Colun', source: 'off' }));
  const hit = (code: string) => ({
    code, product_name: `Leche ${code}`, nutriments: { 'energy-kcal_100g': 40, proteins_100g: 3, carbohydrates_100g: 5, fat_100g: 1 },
  });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ hits: [hit('1'), hit('2')] }))));
  const r = await searchOnline('leche');
  expect(r.map((f) => f.barcode)).toEqual(['2']);
});
