import { useLiveQuery } from 'dexie-react-hooks';
import { getProfile, latestWeight } from '../db/repo';
import { computeTargets } from '../domain/targets';
import { ageOn, todayLocal } from '../domain/dates';
import type { Profile, Targets } from '../domain/types';

export function targetsFor(profile: Profile, weightKg: number, on = todayLocal()): Targets {
  return computeTargets(profile, weightKg, ageOn(profile.birthDate, on));
}

/** Metas de hoy según el perfil y el último peso registrado. undefined mientras carga o si falta algo. */
export function useTargets(): Targets | undefined {
  return useLiveQuery(async () => {
    const [profile, weight] = await Promise.all([getProfile(), latestWeight()]);
    if (!profile || !weight) return undefined;
    return targetsFor(profile, weight.kg);
  }, []);
}
