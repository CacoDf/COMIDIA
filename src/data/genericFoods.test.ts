import genericFoods from './genericFoods.json';
import type { Food } from '../domain/types';

const foods = genericFoods as Food[];

test('tiene al menos 250 alimentos', () => {
  expect(foods.length).toBeGreaterThanOrEqual(250);
});

test('ids únicos con prefijo gen:', () => {
  const ids = foods.map((f) => f.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids.every((id) => /^gen:\d+$/.test(id))).toBe(true);
});

test('valores por 100 g plausibles', () => {
  for (const f of foods) {
    const { kcal, protein, carbs, fat } = f.per100;
    expect(kcal, f.name).toBeGreaterThan(0);
    expect(kcal, f.name).toBeLessThanOrEqual(900);
    expect(protein + carbs + fat, f.name).toBeLessThanOrEqual(100.5);
    expect(Math.min(protein, carbs, fat), f.name).toBeGreaterThanOrEqual(0);
  }
});

test('todos tienen la porción de 100 g y fuente generic', () => {
  for (const f of foods) {
    expect(f.portions[0], f.name).toEqual({ label: '100 g', grams: 100 });
    expect(f.source).toBe('generic');
  }
});

test.each(['Arroz blanco cocido', 'Huevo', 'Palta', 'Marraqueta', 'Pechuga de pollo cocida'])('incluye %s', (name) => {
  expect(foods.some((f) => f.name === name)).toBe(true);
});
