import type { Macros, MealSlot } from './types';

/** Parte habitual del día para cada comida. */
export const MEAL_SHARE: Record<MealSlot, number> = { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snacks: 0.1 };

const MAIN: MealSlot[] = ['breakfast', 'lunch', 'dinner'];

/**
 * Cuánto le toca a una comida de lo que queda del día.
 * Reparte lo restante entre esa comida y las que aún vienen sin anotar (las anteriores ya pasaron),
 * en proporción a su parte habitual. Así un desayuno no se come todo el día.
 */
export function mealBudget(left: Macros, slot: MealSlot, logged: Set<MealSlot>): Macros {
  const open: MealSlot[] =
    slot === 'snacks'
      ? ['snacks', ...MAIN.filter((s) => !logged.has(s))]
      : [slot, ...MAIN.slice(MAIN.indexOf(slot) + 1).filter((s) => !logged.has(s)), ...(logged.has('snacks') ? [] : ['snacks' as const])];
  const fraction = MEAL_SHARE[slot] / open.reduce((sum, s) => sum + MEAL_SHARE[s], 0);
  const part = (n: number) => Math.round(Math.max(0, n) * fraction * 10) / 10;
  return { kcal: Math.round(Math.max(0, left.kcal) * fraction), protein: part(left.protein), carbs: part(left.carbs), fat: part(left.fat) };
}
