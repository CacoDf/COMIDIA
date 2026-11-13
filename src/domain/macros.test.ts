import { macrosForGrams, remaining, rescaleItem, roundMacros, sumMacros, ZERO } from './macros';

test('macrosForGrams escala desde 100 g', () => {
  expect(macrosForGrams({ kcal: 200, protein: 10, carbs: 20, fat: 5 }, 150))
    .toEqual({ kcal: 300, protein: 15, carbs: 30, fat: 7.5 });
});

test('rescaleItem mantiene la proporción', () => {
  const it = { name: 'arroz', grams: 100, macros: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 } };
  expect(rescaleItem(it, 200).macros.kcal).toBe(260);
  expect(rescaleItem(it, 200).grams).toBe(200);
});

test('rescaleItem con 0 g originales no divide por cero', () => {
  const it = { name: 'x', grams: 0, macros: { kcal: 50, protein: 1, carbs: 1, fat: 1 } };
  expect(rescaleItem(it, 100).macros).toEqual(it.macros);
});

test('sumMacros de lista vacía es cero', () => {
  expect(sumMacros([])).toEqual(ZERO);
});

test('sumMacros suma cada campo', () => {
  expect(sumMacros([{ kcal: 1, protein: 2, carbs: 3, fat: 4 }, { kcal: 10, protein: 20, carbs: 30, fat: 40 }]))
    .toEqual({ kcal: 11, protein: 22, carbs: 33, fat: 44 });
});

test('roundMacros: kcal entero, gramos a un decimal', () => {
  expect(roundMacros({ kcal: 123.6, protein: 4.26, carbs: 0.04, fat: 9.95 }))
    .toEqual({ kcal: 124, protein: 4.3, carbs: 0, fat: 10 });
});

test('remaining puede ser negativo', () => {
  expect(remaining({ kcal: 2000, protein: 100, carbs: 200, fat: 60 }, { kcal: 2100, protein: 50, carbs: 200, fat: 70 }))
    .toEqual({ kcal: -100, protein: 50, carbs: 0, fat: -10 });
});
