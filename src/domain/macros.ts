import type { Item, Macros } from './types';

export const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

export function sumMacros(list: Macros[]): Macros {
  return list.reduce(
    (acc, m) => ({ kcal: acc.kcal + m.kcal, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
    { ...ZERO },
  );
}

function scale(m: Macros, factor: number): Macros {
  return { kcal: m.kcal * factor, protein: m.protein * factor, carbs: m.carbs * factor, fat: m.fat * factor };
}

export function macrosForGrams(per100: Macros, grams: number): Macros {
  return scale(per100, grams / 100);
}

export function rescaleItem(item: Item, newGrams: number): Item {
  if (item.grams <= 0) return { ...item, grams: newGrams };
  return { ...item, grams: newGrams, macros: scale(item.macros, newGrams / item.grams) };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function roundMacros(m: Macros): Macros {
  return { kcal: Math.round(m.kcal), protein: round1(m.protein), carbs: round1(m.carbs), fat: round1(m.fat) };
}

export function remaining(target: Macros, eaten: Macros): Macros {
  return {
    kcal: target.kcal - eaten.kcal,
    protein: target.protein - eaten.protein,
    carbs: target.carbs - eaten.carbs,
    fat: target.fat - eaten.fat,
  };
}
