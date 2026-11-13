import type { Activity, Profile, Targets } from './types';

const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  veryHigh: 1.9,
};

const KCAL_PER_KG = 7700;

/** Metas diarias según el spec 7.1 (Mifflin-St Jeor, factor de actividad, objetivo y piso en el basal). */
export function computeTargets(profile: Profile, weightKg: number, ageYears: number): Targets {
  const bmrRaw =
    10 * weightKg + 6.25 * profile.heightCm - 5 * ageYears + (profile.sex === 'male' ? 5 : -161);
  const bmr = Math.round(bmrRaw);
  const tdee = Math.round(bmrRaw * ACTIVITY_FACTOR[profile.activity]);

  if (profile.manualTargets) {
    return { ...profile.manualTargets, bmr, tdee, flooredAtBmr: false, manual: true };
  }

  const dailyAdjust = (profile.rateKgPerWeek * KCAL_PER_KG) / 7;
  const sign = profile.goal === 'lose' ? -1 : profile.goal === 'gain' ? 1 : 0;
  const wanted = Math.round(tdee + sign * dailyAdjust);
  const flooredAtBmr = wanted < bmr;
  const kcal = flooredAtBmr ? bmr : wanted;

  const proteinPerKg = profile.goal === 'lose' ? 2.0 : 1.8;
  const protein = Math.round(proteinPerKg * weightKg);
  const fat = Math.round(Math.max((0.25 * kcal) / 9, 0.6 * weightKg));
  const carbs = Math.max(0, Math.round((kcal - 4 * protein - 9 * fat) / 4));

  return { kcal, protein, carbs, fat, bmr, tdee, flooredAtBmr, manual: false };
}
