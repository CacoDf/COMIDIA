import { sumMacros } from '../../domain/macros';
import type { Item } from '../../domain/types';
import { fmtG, fmtKcal } from '../../ui/labels';

export function mealSummary(items: Item[]): string {
  const t = sumMacros(items.map((i) => i.macros));
  const n = items.length;
  return `${n} ${n === 1 ? 'ingrediente' : 'ingredientes'} · ${fmtKcal(t.kcal)} kcal`;
}

export function macroLine(items: Item[]): string {
  const t = sumMacros(items.map((i) => i.macros));
  return `${fmtKcal(t.kcal)} kcal · P ${fmtG(t.protein)} · C ${fmtG(t.carbs)} · G ${fmtG(t.fat)} g`;
}
