export type Macros = { kcal: number; protein: number; carbs: number; fat: number };
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snacks';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'high' | 'veryHigh';
export type Goal = 'lose' | 'maintain' | 'gain';
export type Profile = {
  sex: 'male' | 'female';
  birthDate: string;
  heightCm: number;
  activity: Activity;
  goal: Goal;
  rateKgPerWeek: 0.25 | 0.5 | 0.75;
  manualTargets?: Macros;
};
export type Portion = { label: string; grams: number };
export type FoodSource = 'generic' | 'off' | 'custom' | 'label';
export type Food = {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  per100: Macros;
  portions: Portion[];
  source: FoodSource;
  updatedAt: number;
};
export type Item = { name: string; grams: number; macros: Macros; foodId?: string };
export type EntrySource = 'text' | 'photo' | 'barcode' | 'search' | 'saved' | 'manual' | 'suggestion';
export type LogEntry = {
  id: string;
  date: string;
  slot: MealSlot;
  name: string;
  items: Item[];
  source: EntrySource;
  createdAt: number;
};
export type SavedMeal = { id: string; name: string; items: Item[]; steps?: string[]; createdAt: number };
export type WeightEntry = { id: string; date: string; kg: number };
export type Settings = { geminiKey?: string; geminiModel?: string; lastExportAt?: number; reminderDismissedAt?: number; scanMode?: 'photo' | 'live' };
export type Targets = Macros & { bmr: number; tdee: number; flooredAtBmr: boolean; manual: boolean };

export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snacks'];
