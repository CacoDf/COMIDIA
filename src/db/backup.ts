import { z } from 'zod';
import { db, resetDb, SINGLETON_KEY } from './db';
import { getProfile, getSettings } from './repo';
import { toLocalDate } from '../domain/dates';
import { FoodSchema, LogEntrySchema, ProfileSchema, SavedMealSchema, WeightEntrySchema } from '../domain/schemas';
import type { Food, LogEntry, Profile, SavedMeal, Settings, WeightEntry } from '../domain/types';

export const BACKUP_APP = 'comidia';
export const BACKUP_FORMAT_VERSION = 1;

export type BackupFile = {
  app: 'comidia';
  formatVersion: 1;
  exportedAt: string;
  data: {
    profile?: Profile;
    settings: Omit<Settings, 'geminiKey'>;
    entries: LogEntry[];
    weights: WeightEntry[];
    foods: Food[];
    savedMeals: SavedMeal[];
  };
};

export type BackupSummary = {
  exportedAt: string;
  entries: number;
  weights: number;
  foods: number;
  savedMeals: number;
  firstDate?: string;
  lastDate?: string;
};

export type BackupErrorKind = 'not-json' | 'wrong-app' | 'newer-version' | 'invalid';

export class BackupError extends Error {
  kind: BackupErrorKind;
  constructor(kind: BackupErrorKind, message?: string) {
    super(message ?? kind);
    this.name = 'BackupError';
    this.kind = kind;
  }
}

const BackupSchema = z.object({
  app: z.literal(BACKUP_APP),
  formatVersion: z.literal(BACKUP_FORMAT_VERSION),
  exportedAt: z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'fecha inválida'),
  data: z.object({
    profile: ProfileSchema.optional(),
    settings: z.object({
      geminiModel: z.string().optional(),
      lastExportAt: z.number().optional(),
      reminderDismissedAt: z.number().optional(),
    }),
    entries: z.array(LogEntrySchema),
    weights: z.array(WeightEntrySchema),
    foods: z.array(FoodSchema),
    savedMeals: z.array(SavedMealSchema),
  }),
});

export async function exportBackup(): Promise<BackupFile> {
  const now = Date.now();
  const { geminiKey: _omit, ...settings } = await getSettings();
  const [entries, weights, foods, savedMeals, profile] = await Promise.all([
    db.entries.toArray(),
    db.weights.toArray(),
    db.foods.filter((f) => f.source !== 'generic').toArray(),
    db.savedMeals.toArray(),
    getProfile(),
  ]);
  return {
    app: BACKUP_APP,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date(now).toISOString(),
    data: { ...(profile ? { profile } : {}), settings, entries, weights, foods, savedMeals },
  };
}

export function parseBackup(text: string): BackupFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new BackupError('not-json');
  }
  if (typeof raw !== 'object' || raw === null || (raw as { app?: unknown }).app !== BACKUP_APP) {
    throw new BackupError('wrong-app');
  }
  const version = (raw as { formatVersion?: unknown }).formatVersion;
  if (typeof version === 'number' && version > BACKUP_FORMAT_VERSION) {
    throw new BackupError('newer-version');
  }
  const parsed = BackupSchema.safeParse(raw);
  if (!parsed.success) throw new BackupError('invalid', parsed.error.message);
  return parsed.data as BackupFile;
}

export function summarize(b: BackupFile): BackupSummary {
  const dates = b.data.entries.map((e) => e.date).sort();
  return {
    exportedAt: b.exportedAt,
    entries: b.data.entries.length,
    weights: b.data.weights.length,
    foods: b.data.foods.length,
    savedMeals: b.data.savedMeals.length,
    firstDate: dates[0],
    lastDate: dates[dates.length - 1],
  };
}

/** Reemplaza todos los datos por los del respaldo. Conserva la key y el modelo de Gemini del teléfono. */
export async function importBackup(b: BackupFile): Promise<void> {
  const { geminiKey, geminiModel } = await getSettings();
  const generic = await db.foods.filter((f) => f.source === 'generic').toArray();
  await db.transaction('rw', db.tables, async () => {
    await resetDb();
    if (b.data.profile) await db.profile.put({ ...b.data.profile, key: SINGLETON_KEY });
    const settings: Settings & { key: string } = { ...b.data.settings, key: SINGLETON_KEY };
    if (geminiKey) settings.geminiKey = geminiKey;
    if (geminiModel) settings.geminiModel = geminiModel;
    await db.settings.put(settings);
    await db.entries.bulkPut(b.data.entries);
    await db.weights.bulkPut(b.data.weights);
    await db.foods.bulkPut([...generic, ...b.data.foods]);
    await db.savedMeals.bulkPut(b.data.savedMeals);
  });
}

export function backupFileName(now: Date): string {
  return `comidia-respaldo-${toLocalDate(now)}.json`;
}
