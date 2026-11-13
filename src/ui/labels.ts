import type { Activity, Goal, MealSlot } from '../domain/types';

export const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snacks: 'Colaciones',
};

export const GOAL_LABEL: Record<Goal, string> = { lose: 'Bajar', maintain: 'Mantener', gain: 'Subir' };

export const ACTIVITY_LABEL: Record<Activity, { title: string; detail: string }> = {
  sedentary: { title: 'Sedentario', detail: 'Poco o nada de ejercicio' },
  light: { title: 'Ligero', detail: 'Ejercicio 1 a 3 días por semana' },
  moderate: { title: 'Moderado', detail: 'Ejercicio 3 a 5 días por semana' },
  high: { title: 'Alto', detail: 'Ejercicio 6 a 7 días por semana' },
  veryHigh: { title: 'Muy alto', detail: 'Ejercicio intenso diario o trabajo físico' },
};

export const MACRO_LABEL = { kcal: 'Calorías', protein: 'Proteína', carbs: 'Carbos', fat: 'Grasa' } as const;

const kcalFmt = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
const gFmt = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
const g1Fmt = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 });

export const fmtKcal = (n: number) => kcalFmt.format(Math.round(n));
export const fmtG = (n: number) => gFmt.format(Math.round(n));
export const fmtG1 = (n: number) => g1Fmt.format(n);
