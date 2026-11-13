import Dexie, { type EntityTable } from 'dexie';
import type { Food, LogEntry, Profile, SavedMeal, Settings, WeightEntry } from '../domain/types';

export const SINGLETON_KEY = 'me';

type ProfileRow = Profile & { key: string };
type SettingsRow = Settings & { key: string };

export class ComidiaDb extends Dexie {
  profile!: EntityTable<ProfileRow, 'key'>;
  settings!: EntityTable<SettingsRow, 'key'>;
  entries!: EntityTable<LogEntry, 'id'>;
  weights!: EntityTable<WeightEntry, 'id'>;
  foods!: EntityTable<Food, 'id'>;
  savedMeals!: EntityTable<SavedMeal, 'id'>;

  constructor() {
    super('comidia');
    this.version(1).stores({
      profile: 'key',
      settings: 'key',
      entries: 'id, date, [date+slot]',
      weights: 'id, &date',
      foods: 'id, barcode, name',
      savedMeals: 'id, name',
    });
  }
}

export const db = new ComidiaDb();

/** Vacía todas las tablas (usado al importar un respaldo y en pruebas). */
export async function resetDb(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
  });
}
