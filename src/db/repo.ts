import { db, SINGLETON_KEY } from './db';
import type { Food, LogEntry, MealSlot, Profile, SavedMeal, Settings, WeightEntry } from '../domain/types';

const newId = () => crypto.randomUUID();

/** Minúsculas y sin tildes, para buscar "platano" y encontrar "Plátano". */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// Perfil y ajustes

export async function getProfile(): Promise<Profile | undefined> {
  const row = await db.profile.get(SINGLETON_KEY);
  if (!row) return undefined;
  const { key: _key, ...profile } = row;
  return profile;
}

export async function saveProfile(p: Profile): Promise<void> {
  await db.profile.put({ ...p, key: SINGLETON_KEY });
}

export async function getSettings(): Promise<Settings> {
  const row = await db.settings.get(SINGLETON_KEY);
  if (!row) return {};
  const { key: _key, ...settings } = row;
  return settings;
}

export async function patchSettings(p: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  const next: Settings & { key: string } = { ...current, ...p, key: SINGLETON_KEY };
  for (const k of Object.keys(next) as (keyof typeof next)[]) if (next[k] === undefined) delete next[k];
  await db.settings.put(next);
}

// Diario

export async function listEntries(date: string): Promise<LogEntry[]> {
  return (await db.entries.where('date').equals(date).toArray()).sort((a, b) => a.createdAt - b.createdAt);
}

export async function listEntriesInRange(from: string, to: string): Promise<LogEntry[]> {
  return db.entries.where('date').between(from, to, true, true).toArray();
}

export async function addEntry(e: Omit<LogEntry, 'id' | 'createdAt'>): Promise<LogEntry> {
  const entry: LogEntry = { ...e, id: newId(), createdAt: Date.now() };
  await db.entries.add(entry);
  return entry;
}

export async function updateEntry(id: string, patch: Partial<Omit<LogEntry, 'id'>>): Promise<void> {
  await db.entries.update(id, patch);
}

export async function deleteEntry(id: string): Promise<void> {
  await db.entries.delete(id);
}

export async function copyEntry(id: string, toDate: string, toSlot: MealSlot): Promise<LogEntry> {
  const original = await db.entries.get(id);
  if (!original) throw new Error(`Entrada ${id} no existe`);
  const { id: _id, createdAt: _c, ...rest } = original;
  return addEntry({ ...rest, date: toDate, slot: toSlot });
}

// Peso

export async function listWeights(): Promise<WeightEntry[]> {
  return db.weights.orderBy('date').toArray();
}

export async function latestWeight(): Promise<WeightEntry | undefined> {
  return db.weights.orderBy('date').last();
}

export async function setWeight(date: string, kg: number): Promise<void> {
  const existing = await db.weights.where('date').equals(date).first();
  await db.weights.put({ id: existing?.id ?? newId(), date, kg });
}

// Alimentos

export async function getFood(id: string): Promise<Food | undefined> {
  return db.foods.get(id);
}

export async function getFoodByBarcode(code: string): Promise<Food | undefined> {
  return db.foods.where('barcode').equals(code).first();
}

export async function upsertFood(f: Food): Promise<void> {
  await db.foods.put(f);
}

export async function searchLocalFoods(q: string, limit: number): Promise<Food[]> {
  const words = normalize(q).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return db.foods
    .filter((f) => {
      const hay = normalize(`${f.name} ${f.brand ?? ''}`);
      return words.every((w) => hay.includes(w));
    })
    .limit(limit)
    .toArray();
}

// Comidas guardadas

export async function listSavedMeals(): Promise<SavedMeal[]> {
  return (await db.savedMeals.toArray()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export async function saveMeal(m: Omit<SavedMeal, 'id' | 'createdAt'> & { id?: string }): Promise<SavedMeal> {
  const existing = m.id ? await db.savedMeals.get(m.id) : undefined;
  const meal: SavedMeal = { ...m, id: m.id ?? newId(), createdAt: existing?.createdAt ?? Date.now() };
  await db.savedMeals.put(meal);
  return meal;
}

export async function deleteMeal(id: string): Promise<void> {
  await db.savedMeals.delete(id);
}
