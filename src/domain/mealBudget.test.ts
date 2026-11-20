import { mealBudget, MEAL_SHARE } from './mealBudget';

const left = { kcal: 2000, protein: 160, carbs: 200, fat: 60 };

test('las proporciones suman 1', () => {
  expect(Object.values(MEAL_SHARE).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
});

test('desayuno con todo el día por delante apunta a su parte, no a todo lo que queda', () => {
  expect(mealBudget(left, 'breakfast', new Set())).toEqual({ kcal: 500, protein: 40, carbs: 50, fat: 15 });
});

test('cena con el almuerzo anotado reparte entre la cena y la colación', () => {
  const b = mealBudget({ kcal: 1000, protein: 100, carbs: 100, fat: 30 }, 'dinner', new Set(['lunch']));
  expect(b).toEqual({ kcal: 750, protein: 75, carbs: 75, fat: 22.5 });
});

test('cena con la colación ya anotada se lleva todo lo que queda', () => {
  expect(mealBudget(left, 'dinner', new Set(['breakfast', 'lunch', 'snacks'])).kcal).toBe(2000);
});

test('las comidas anteriores sin anotar no cuentan (ya pasaron)', () => {
  // almuerzo sin desayuno anotado: reparte entre almuerzo, cena y colación
  expect(mealBudget(left, 'lunch', new Set()).kcal).toBe(Math.round(2000 * (0.35 / 0.75)));
});

test('colación en la mañana es una parte chica', () => {
  expect(mealBudget(left, 'snacks', new Set()).kcal).toBe(200);
});

test('lo negativo cuenta como cero', () => {
  expect(mealBudget({ kcal: -100, protein: 10, carbs: -5, fat: 0 }, 'dinner', new Set())).toEqual({ kcal: 0, protein: 7.5, carbs: 0, fat: 0 });
});
