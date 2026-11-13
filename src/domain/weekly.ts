import { sumMacros, ZERO } from './macros';
import type { LogEntry, Macros } from './types';

/** Promedio diario de la semana contando solo los días con al menos una entrada. */
export function weeklyAverage(entries: LogEntry[]): { daysLogged: number; average: Macros } {
  const days = new Set(entries.map((e) => e.date));
  if (days.size === 0) return { daysLogged: 0, average: { ...ZERO } };
  const total = sumMacros(entries.flatMap((e) => e.items.map((i) => i.macros)));
  const n = days.size;
  return {
    daysLogged: n,
    average: { kcal: total.kcal / n, protein: total.protein / n, carbs: total.carbs / n, fat: total.fat / n },
  };
}
