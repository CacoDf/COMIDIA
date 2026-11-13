import { z } from 'zod';

const nonNeg = z.number().finite().min(0);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const MacrosSchema = z.object({ kcal: nonNeg, protein: nonNeg, carbs: nonNeg, fat: nonNeg });
export const MealSlotSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snacks']);

export const ItemSchema = z.object({
  name: z.string().min(1),
  grams: nonNeg,
  macros: MacrosSchema,
  foodId: z.string().optional(),
});

export const ProfileSchema = z.object({
  sex: z.enum(['male', 'female']),
  birthDate: date,
  heightCm: z.number().positive(),
  activity: z.enum(['sedentary', 'light', 'moderate', 'high', 'veryHigh']),
  goal: z.enum(['lose', 'maintain', 'gain']),
  rateKgPerWeek: z.union([z.literal(0.25), z.literal(0.5), z.literal(0.75)]),
  manualTargets: MacrosSchema.optional(),
});

export const FoodSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  brand: z.string().optional(),
  barcode: z.string().optional(),
  per100: MacrosSchema,
  portions: z.array(z.object({ label: z.string(), grams: z.number().positive() })),
  source: z.enum(['generic', 'off', 'custom', 'label']),
  updatedAt: z.number(),
});

export const LogEntrySchema = z.object({
  id: z.string().min(1),
  date,
  slot: MealSlotSchema,
  name: z.string(),
  items: z.array(ItemSchema),
  source: z.enum(['text', 'photo', 'barcode', 'search', 'saved', 'manual', 'suggestion']),
  createdAt: z.number(),
});

export const SavedMealSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  items: z.array(ItemSchema),
  steps: z.array(z.string()).optional(),
  createdAt: z.number(),
});

export const WeightEntrySchema = z.object({ id: z.string().min(1), date, kg: z.number().positive() });
