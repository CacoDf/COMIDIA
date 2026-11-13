import genericFoods from '../data/genericFoods.json';
import { normalize, searchLocalFoods } from '../db/repo';
import { db } from '../db/db';
import { searchProducts } from './openFoodFacts';
import type { Food } from '../domain/types';

const MAX = 30;
const GENERIC = (genericFoods as Food[]).map((f) => ({ food: f, hay: normalize(f.name) }));

/** Propios y ya usados primero, luego genéricos. Sin tildes ni mayúsculas, por palabras en cualquier orden. */
export async function searchLocal(query: string): Promise<Food[]> {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const own = await searchLocalFoods(query, MAX);
  const ownIds = new Set(own.map((f) => f.id));
  const generic = GENERIC.filter(({ food, hay }) => !ownIds.has(food.id) && words.every((w) => hay.includes(w)))
    .sort((a, b) => a.hay.length - b.hay.length)
    .map(({ food }) => food);
  return [...own, ...generic].slice(0, MAX);
}

/** Productos de Open Food Facts que no estén ya guardados localmente. */
export async function searchOnline(query: string): Promise<Food[]> {
  const results = await searchProducts(query);
  const known = new Set((await db.foods.bulkGet(results.map((f) => f.id))).filter(Boolean).map((f) => f!.id));
  return results.filter((f) => !known.has(f.id));
}
