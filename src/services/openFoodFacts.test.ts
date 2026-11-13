import { fetchProduct, OffError, searchProducts, toFood } from './openFoodFacts';

const full = {
  code: '7802920009872',
  product_name: 'Leche descremada',
  brands: 'Colun',
  serving_quantity: 200,
  nutriments: { 'energy-kcal_100g': 35, proteins_100g: 3.3, carbohydrates_100g: 4.8, fat_100g: 0.1 },
};

function mockFetch(body: unknown, status = 200) {
  const fn = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

test('producto completo se convierte en Food', async () => {
  mockFetch({ status: 1, product: full });
  const f = await fetchProduct('7802920009872');
  expect(f).toMatchObject({
    id: 'off:7802920009872',
    name: 'Leche descremada',
    brand: 'Colun',
    barcode: '7802920009872',
    source: 'off',
    per100: { kcal: 35, protein: 3.3, carbs: 4.8, fat: 0.1 },
  });
  expect(f?.portions).toEqual([{ label: '100 g', grams: 100 }, { label: 'Porción', grams: 200 }]);
});

test('producto sin grasa se trata como no encontrado', () => {
  const { fat_100g: _f, ...rest } = full.nutriments;
  expect(toFood({ ...full, nutriments: rest })).toBeNull();
});

test('producto sin nombre se trata como no encontrado', () => {
  expect(toFood({ ...full, product_name: '' })).toBeNull();
});

test('solo energía en kJ se convierte a kcal', () => {
  const { 'energy-kcal_100g': _k, ...rest } = full.nutriments;
  expect(toFood({ ...full, nutriments: { ...rest, energy_100g: 418.4 } })?.per100.kcal).toBe(100);
});

test('valores en texto se aceptan como números', () => {
  expect(toFood({ ...full, nutriments: { ...full.nutriments, fat_100g: '0.5' } })?.per100.fat).toBe(0.5);
});

test('porción no numérica se ignora', () => {
  expect(toFood({ ...full, serving_quantity: 'abc' })?.portions).toEqual([{ label: '100 g', grams: 100 }]);
});

test('status 0 devuelve null', async () => {
  mockFetch({ status: 0, status_verbose: 'product not found' });
  expect(await fetchProduct('1')).toBeNull();
});

test('404 devuelve null', async () => {
  mockFetch({ status: 0 }, 404);
  expect(await fetchProduct('1')).toBeNull();
});

test('429 lanza rate-limit', async () => {
  mockFetch({}, 429);
  await expect(fetchProduct('1')).rejects.toMatchObject({ kind: 'rate-limit' });
});

test('fallo de red lanza offline', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Load failed')));
  await expect(fetchProduct('1')).rejects.toBeInstanceOf(OffError);
  await expect(fetchProduct('1')).rejects.toMatchObject({ kind: 'offline' });
});

test('búsqueda descarta incompletos', async () => {
  mockFetch({ hits: [full, { ...full, code: '2' }, { ...full, code: '3', nutriments: {} }] });
  const list = await searchProducts('leche');
  expect(list.map((f) => f.barcode)).toEqual(['7802920009872', '2']);
});

test('búsqueda acepta respuesta con products', async () => {
  mockFetch({ products: [full] });
  expect(await searchProducts('leche')).toHaveLength(1);
});
