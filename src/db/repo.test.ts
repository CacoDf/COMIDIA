import { resetDb } from './db';
import {
  addEntry, copyEntry, getFoodByBarcode, getSettings, latestWeight, listEntries, listEntriesInRange,
  listWeights, patchSettings, searchLocalFoods, setWeight, updateEntry, upsertFood,
} from './repo';
import type { Food, LogEntry } from '../domain/types';

const m = { kcal: 100, protein: 1, carbs: 2, fat: 3 };
const entry = (date: string, slot: LogEntry['slot'] = 'lunch'): Omit<LogEntry, 'id' | 'createdAt'> =>
  ({ date, slot, name: 'x', items: [{ name: 'x', grams: 100, macros: m }], source: 'manual' });
const food = (over: Partial<Food>): Food => ({
  id: 'f1', name: 'Plátano', per100: m, portions: [{ label: '100 g', grams: 100 }], source: 'generic', updatedAt: 1, ...over,
});

beforeEach(async () => {
  await resetDb();
});

test('listEntries devuelve solo las del día', async () => {
  await addEntry(entry('2026-11-13'));
  await addEntry(entry('2026-11-12'));
  const list = await listEntries('2026-11-13');
  expect(list).toHaveLength(1);
  expect(list[0].date).toBe('2026-11-13');
  expect(list[0].id).toBeTruthy();
});

test('copyEntry crea otra entrada y deja la original', async () => {
  const e = await addEntry(entry('2026-11-13'));
  const c = await copyEntry(e.id, '2026-11-14', 'dinner');
  expect(c.id).not.toBe(e.id);
  expect(await listEntries('2026-11-13')).toHaveLength(1);
  expect((await listEntries('2026-11-14'))[0].slot).toBe('dinner');
});

test('updateEntry cambiando slot la mueve', async () => {
  const e = await addEntry(entry('2026-11-13', 'lunch'));
  await updateEntry(e.id, { slot: 'dinner' });
  expect((await listEntries('2026-11-13'))[0].slot).toBe('dinner');
});

test('setWeight dos veces el mismo día deja una sola fila', async () => {
  await setWeight('2026-11-13', 80);
  await setWeight('2026-11-13', 79.5);
  const w = await listWeights();
  expect(w).toHaveLength(1);
  expect(w[0].kg).toBe(79.5);
});

test('latestWeight devuelve la fecha más reciente', async () => {
  await setWeight('2026-11-13', 79);
  await setWeight('2026-11-01', 81);
  expect((await latestWeight())?.kg).toBe(79);
  expect((await listWeights()).map((w) => w.date)).toEqual(['2026-11-01', '2026-11-13']);
});

test('searchLocalFoods ignora tildes y mayúsculas', async () => {
  await upsertFood(food({}));
  expect((await searchLocalFoods('platano', 10))[0]?.name).toBe('Plátano');
  expect(await searchLocalFoods('manzana', 10)).toHaveLength(0);
});

test('getFoodByBarcode encuentra por código', async () => {
  await upsertFood(food({ id: 'off:780', barcode: '780', source: 'off' }));
  expect((await getFoodByBarcode('780'))?.id).toBe('off:780');
  expect(await getFoodByBarcode('999')).toBeUndefined();
});

test('getSettings en base vacía devuelve {}', async () => {
  expect(await getSettings()).toEqual({});
  await patchSettings({ geminiModel: 'm' });
  await patchSettings({ lastExportAt: 5 });
  expect(await getSettings()).toEqual({ geminiModel: 'm', lastExportAt: 5 });
});

test('listEntriesInRange incluye ambos extremos', async () => {
  for (const d of ['2026-11-08', '2026-11-09', '2026-11-12', '2026-11-15', '2026-11-16']) await addEntry(entry(d));
  const list = await listEntriesInRange('2026-11-09', '2026-11-15');
  expect(list.map((e) => e.date).sort()).toEqual(['2026-11-09', '2026-11-12', '2026-11-15']);
});
