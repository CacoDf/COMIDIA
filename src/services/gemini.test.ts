import {
  AiError, estimateFromPhoto, estimateFromText, listModels, pickDefaultModel, readLabel, suggestMeals, testKey,
} from './gemini';

const cfg = { key: 'K', model: 'gemini-x-flash-lite' };

function reply(obj: unknown) {
  return { candidates: [{ content: { parts: [{ text: typeof obj === 'string' ? obj : JSON.stringify(obj) }] } }] };
}

function mockFetch(body: unknown, status = 200) {
  const fn = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fn);
  return fn;
}

const huevo = { name: 'Huevo revuelto', grams: 100, kcal: 150, protein: 10, carbs: 1, fat: 11 };

afterEach(() => vi.unstubAllGlobals());

test('respuesta válida se convierte en Item[]', async () => {
  const fn = mockFetch(reply({ items: [huevo] }));
  const items = await estimateFromText(cfg, '2 huevos');
  expect(items).toEqual([{ name: 'Huevo revuelto', grams: 100, macros: { kcal: 150, protein: 10, carbs: 1, fat: 11 } }]);
  const [url, init] = fn.mock.calls[0];
  expect(url).toContain('/models/gemini-x-flash-lite:generateContent');
  expect(init.headers['x-goog-api-key']).toBe('K');
  const body = JSON.parse(init.body);
  expect(body.generationConfig.responseMimeType).toBe('application/json');
  expect(JSON.stringify(body.contents)).toContain('2 huevos');
});

test('texto que no es JSON lanza invalid-response', async () => {
  mockFetch(reply('esto no es json'));
  await expect(estimateFromText(cfg, 'x')).rejects.toMatchObject({ kind: 'invalid-response' });
});

test('gramos negativos lanzan invalid-response', async () => {
  mockFetch(reply({ items: [{ ...huevo, grams: -5 }] }));
  await expect(estimateFromText(cfg, 'x')).rejects.toMatchObject({ kind: 'invalid-response' });
});

test('sin candidatos lanza invalid-response', async () => {
  mockFetch({ candidates: [] });
  await expect(estimateFromText(cfg, 'x')).rejects.toMatchObject({ kind: 'invalid-response' });
});

test('lista vacía lanza no-food', async () => {
  mockFetch(reply({ items: [] }));
  await expect(estimateFromText(cfg, 'x')).rejects.toMatchObject({ kind: 'no-food' });
});

test('429 lanza quota', async () => {
  mockFetch({ error: { code: 429 } }, 429);
  await expect(estimateFromText(cfg, 'x')).rejects.toMatchObject({ kind: 'quota' });
});

test('403 lanza bad-key', async () => {
  mockFetch({ error: { code: 403 } }, 403);
  await expect(estimateFromText(cfg, 'x')).rejects.toMatchObject({ kind: 'bad-key' });
});

test('400 por key inválida lanza bad-key', async () => {
  mockFetch({ error: { code: 400, message: 'API key not valid. Please pass a valid API key.' } }, 400);
  await expect(estimateFromText(cfg, 'x')).rejects.toMatchObject({ kind: 'bad-key' });
});

test('key vacía lanza no-key sin llamar a la red', async () => {
  const fn = mockFetch(reply({ items: [huevo] }));
  await expect(estimateFromText({ ...cfg, key: '' }, 'x')).rejects.toMatchObject({ kind: 'no-key' });
  expect(fn).not.toHaveBeenCalled();
});

test('fallo de red lanza offline', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Load failed')));
  await expect(estimateFromText(cfg, 'x')).rejects.toBeInstanceOf(AiError);
  await expect(estimateFromText(cfg, 'x')).rejects.toMatchObject({ kind: 'offline' });
});

test('la foto viaja como inlineData JPEG con la nota', async () => {
  const fn = mockFetch(reply({ items: [huevo] }));
  await estimateFromPhoto(cfg, 'BASE64DATA', 'con arroz integral');
  const body = JSON.parse(fn.mock.calls[0][1].body);
  const parts = body.contents[0].parts;
  expect(parts).toContainEqual({ inlineData: { mimeType: 'image/jpeg', data: 'BASE64DATA' } });
  expect(JSON.stringify(parts)).toContain('con arroz integral');
});

test('readLabel devuelve valores por 100 g', async () => {
  mockFetch(reply({ name: 'Galletas', per100: { kcal: 480, protein: 6, carbs: 70, fat: 20 }, servingGrams: 30 }));
  expect(await readLabel(cfg, 'B64')).toEqual({ name: 'Galletas', per100: { kcal: 480, protein: 6, carbs: 70, fat: 20 }, servingGrams: 30 });
});

test('suggestMeals envía los restantes y devuelve 3', async () => {
  const s = { name: 'Pollo con arroz', items: [huevo], steps: ['Cocinar'] };
  const fn = mockFetch(reply({ suggestions: [s, s, s, s] }));
  const out = await suggestMeals(cfg, { remaining: { kcal: 500, protein: 45, carbs: 50, fat: 10 }, slot: 'dinner', note: 'sin lactosa' });
  expect(out).toHaveLength(3);
  expect(out[0]).toMatchObject({ name: 'Pollo con arroz', steps: ['Cocinar'] });
  expect(out[0].items[0].macros.kcal).toBe(150);
  const sent = JSON.stringify(JSON.parse(fn.mock.calls[0][1].body).contents);
  expect(sent).toContain('500');
  expect(sent).toContain('45');
  expect(sent).toContain('sin lactosa');
});

test('suggestMeals sin sugerencias lanza invalid-response', async () => {
  mockFetch(reply({ suggestions: [] }));
  await expect(suggestMeals(cfg, { remaining: { kcal: 1, protein: 1, carbs: 1, fat: 1 }, slot: 'lunch' }))
    .rejects.toMatchObject({ kind: 'invalid-response' });
});

test('listModels devuelve solo los que generan contenido', async () => {
  mockFetch({ models: [
    { name: 'models/gemini-a-flash', supportedGenerationMethods: ['generateContent', 'countTokens'] },
    { name: 'models/text-embedding', supportedGenerationMethods: ['embedContent'] },
  ] });
  expect(await listModels('K')).toEqual(['gemini-a-flash']);
});

test('testKey con key rechazada lanza bad-key', async () => {
  mockFetch({ error: { code: 400, message: 'API key not valid' } }, 400);
  await expect(testKey('mala')).rejects.toMatchObject({ kind: 'bad-key' });
});

test('pickDefaultModel prefiere el flash-lite más nuevo', () => {
  expect(pickDefaultModel(['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.9-flash-lite-preview']))
    .toBe('gemini-3.5-flash-lite');
  expect(pickDefaultModel(['gemini-3.6-flash', 'gemini-3.8-flash'])).toBe('gemini-3.8-flash');
  expect(pickDefaultModel(['gemini-3.10-flash', 'gemini-3.9-flash'])).toBe('gemini-3.10-flash');
  expect(pickDefaultModel(['gemini-3.9-flash-lite-preview'])).toBe('gemini-3.9-flash-lite-preview');
  expect(pickDefaultModel([])).toBeUndefined();
});
