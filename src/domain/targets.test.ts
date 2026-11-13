import { computeTargets } from './targets';

const base = { birthDate: '1996-01-01', rateKgPerWeek: 0.5 } as const;

test('hombre 80 kg, 180 cm, 30 años, moderado, bajar 0.5', () => {
  const t = computeTargets({ ...base, sex: 'male', heightCm: 180, activity: 'moderate', goal: 'lose' }, 80, 30);
  expect(t).toMatchObject({ bmr: 1780, tdee: 2759, kcal: 2209, protein: 160, fat: 61, carbs: 255, flooredAtBmr: false, manual: false });
});

test('mantener no ajusta y usa 1.8 g/kg', () => {
  const t = computeTargets({ ...base, sex: 'male', heightCm: 180, activity: 'moderate', goal: 'maintain' }, 80, 30);
  expect(t.kcal).toBe(2759);
  expect(t.protein).toBe(144);
});

test('subir suma el ajuste', () => {
  const t = computeTargets({ ...base, sex: 'male', heightCm: 180, activity: 'moderate', goal: 'gain' }, 80, 30);
  expect(t.kcal).toBe(3309);
});

test('piso en metabolismo basal', () => {
  const t = computeTargets({ ...base, rateKgPerWeek: 0.75, sex: 'female', heightCm: 165, activity: 'sedentary', goal: 'lose' }, 60, 30);
  expect(t.bmr).toBe(1320);
  expect(t.kcal).toBe(1320);
  expect(t.flooredAtBmr).toBe(true);
});

test('metas manuales se respetan', () => {
  const manual = { kcal: 2000, protein: 150, carbs: 200, fat: 67 };
  const t = computeTargets({ ...base, sex: 'male', heightCm: 180, activity: 'moderate', goal: 'lose', manualTargets: manual }, 80, 30);
  expect(t).toMatchObject({ ...manual, manual: true, bmr: 1780 });
});
