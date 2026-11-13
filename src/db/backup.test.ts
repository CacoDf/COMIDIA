import { db, resetDb } from './db';
import { backupFileName, BackupError, exportBackup, importBackup, parseBackup, summarize } from './backup';
import { addEntry, getProfile, getSettings, listEntries, listSavedMeals, listWeights, patchSettings, saveMeal, saveProfile, setWeight, upsertFood } from './repo';
import type { Profile } from '../domain/types';

const m = { kcal: 100, protein: 1, carbs: 2, fat: 3 };
const profile: Profile = { sex: 'male', birthDate: '1996-01-01', heightCm: 180, activity: 'moderate', goal: 'lose', rateKgPerWeek: 0.5 };

async function seed() {
  await saveProfile(profile);
  await patchSettings({ geminiKey: 'SECRETA', geminiModel: 'modelo-a' });
  await addEntry({ date: '2026-11-10', slot: 'lunch', name: 'a', items: [{ name: 'a', grams: 100, macros: m }], source: 'manual' });
  await addEntry({ date: '2026-11-13', slot: 'dinner', name: 'b', items: [{ name: 'b', grams: 50, macros: m }], source: 'text' });
  await setWeight('2026-11-10', 80);
  await upsertFood({ id: 'off:1', name: 'Leche', barcode: '1', per100: m, portions: [], source: 'off', updatedAt: 1 });
  await upsertFood({ id: 'gen:1', name: 'Arroz', per100: m, portions: [], source: 'generic', updatedAt: 1 });
  await saveMeal({ name: 'Avena', items: [{ name: 'avena', grams: 40, macros: m }] });
}

beforeEach(async () => {
  await resetDb();
});

test('ida y vuelta conserva los datos', async () => {
  await seed();
  const file = parseBackup(JSON.stringify(await exportBackup()));
  await resetDb();
  await importBackup(file);
  expect(await getProfile()).toEqual(profile);
  expect(await listEntries('2026-11-13')).toHaveLength(1);
  expect(await listEntries('2026-11-10')).toHaveLength(1);
  expect(await listWeights()).toHaveLength(1);
  expect(await listSavedMeals()).toHaveLength(1);
  expect(await db.foods.get('off:1')).toBeTruthy();
});

test('no exporta alimentos genéricos', async () => {
  await seed();
  const file = await exportBackup();
  expect(file.data.foods.map((f) => f.id)).toEqual(['off:1']);
});

test('el archivo no contiene la key', async () => {
  await seed();
  expect(JSON.stringify(await exportBackup())).not.toContain('SECRETA');
});

test('exportar no marca el respaldo como hecho (eso pasa al compartir)', async () => {
  await exportBackup();
  expect((await getSettings()).lastExportAt).toBeUndefined();
});

test('una fecha de exportación inválida se rechaza', () => {
  const text = JSON.stringify({ app: 'comidia', formatVersion: 1, exportedAt: 'x', data: { settings: {}, entries: [], weights: [], foods: [], savedMeals: [] } });
  expect(() => parseBackup(text)).toThrow(expect.objectContaining({ kind: 'invalid' }));
});

test('importar conserva la key y el modelo del teléfono', async () => {
  await seed();
  const file = await exportBackup();
  await patchSettings({ geminiKey: 'OTRA', geminiModel: 'modelo-b' });
  await importBackup(file);
  const s = await getSettings();
  expect(s.geminiKey).toBe('OTRA');
  expect(s.geminiModel).toBe('modelo-b');
});

test('importar reemplaza los datos actuales', async () => {
  await seed();
  const file = await exportBackup();
  await addEntry({ date: '2026-11-20', slot: 'lunch', name: 'nueva', items: [], source: 'manual' });
  await importBackup(file);
  expect(await listEntries('2026-11-20')).toHaveLength(0);
});

test.each([
  ['no es json', 'not-json'],
  ['{"app":"otra","formatVersion":1}', 'wrong-app'],
  ['{"app":"comidia","formatVersion":2,"exportedAt":"x","data":{}}', 'newer-version'],
  ['{"app":"comidia","formatVersion":1,"exportedAt":"x","data":{"entries":"mal"}}', 'invalid'],
])('parseBackup rechaza %s', (text, kind) => {
  expect(() => parseBackup(text)).toThrow(BackupError);
  try {
    parseBackup(text);
  } catch (e) {
    expect((e as BackupError).kind).toBe(kind);
  }
});

test('un archivo rechazado no toca los datos', async () => {
  await seed();
  expect(() => parseBackup('{"app":"otra"}')).toThrow();
  expect(await listEntries('2026-11-13')).toHaveLength(1);
});

test('summarize cuenta y da el rango de fechas', async () => {
  await seed();
  const s = summarize(await exportBackup());
  expect(s).toMatchObject({ entries: 2, weights: 1, foods: 1, savedMeals: 1, firstDate: '2026-11-10', lastDate: '2026-11-13' });
});

test('backupFileName usa la fecha local', () => {
  expect(backupFileName(new Date(2026, 10, 13, 23, 50))).toBe('comidia-respaldo-2026-11-13.json');
});
