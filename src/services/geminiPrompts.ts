import type { Macros, MealSlot } from '../domain/types';

const SLOT_ES: Record<MealSlot, string> = {
  breakfast: 'desayuno',
  lunch: 'almuerzo',
  dinner: 'cena',
  snacks: 'colación',
};

const ESTIMATE_RULES = `Eres un nutricionista chileno. Tu tarea es estimar calorías y macronutrientes.
Reglas:
- Separa la comida en ingredientes, uno por elemento de la lista.
- Usa los gramos del alimento tal como se come (cocido si está cocido).
- Si no se indica cantidad, usa porciones habituales en Chile: una marraqueta pesa unos 100 g, una hallulla unos 90 g, una taza son unos 200 ml, una cucharada de aceite unos 13 g, una palta mediana sin cáscara unos 150 g, un huevo unos 50 g.
- Para cada ingrediente da: name (en español de Chile), grams, kcal, protein, carbs y fat (en gramos).
- Siempre estima, aunque tengas dudas. No te niegues.
- Si no hay comida, devuelve items como lista vacía.`;

export function textPrompt(text: string): string {
  return `${ESTIMATE_RULES}\n\nComida descrita por el usuario:\n${text}`;
}

export function photoPrompt(note?: string): string {
  const extra = note?.trim() ? `\n\nNota del usuario sobre la foto: ${note.trim()}` : '';
  return `${ESTIMATE_RULES}\n- Calcula las porciones por lo que se ve en la foto (tamaño del plato, cubiertos, envases).${extra}`;
}

export function refinePrompt(req: { items: { name: string; grams: number; macros: { kcal: number; protein: number; carbs: number; fat: number } }[]; correction: string; text?: string; hasPhoto: boolean }): string {
  const previous = JSON.stringify(req.items.map((i) => ({ name: i.name, grams: Math.round(i.grams), ...i.macros })));
  const source = req.hasPhoto ? 'La foto de la comida va adjunta.' : req.text ? `La comida descrita originalmente: ${req.text}` : '';
  return `${ESTIMATE_RULES}

Ya hiciste esta estimación de la comida: ${previous}
${source}
El usuario la corrige así: «${req.correction.trim()}»
Devuelve la lista COMPLETA corregida: agrega lo que falta, quita lo que no está, cambia cantidades o ingredientes si el usuario lo dice, y deja igual todo lo que no menciona.`;
}

export const LABEL_PROMPT = `Lee la tabla de información nutricional de esta foto de un producto chileno.
Devuelve los valores por 100 g (o 100 ml): kcal (energía), protein, carbs (hidratos de carbono disponibles) y fat (grasa total).
Si la tabla solo trae valores por porción, conviértelos a 100 g usando los gramos de la porción.
Si aparece, devuelve servingGrams (gramos de una porción) y name (nombre del producto). No inventes valores que no estén en la foto.`;

const fmt = (n: number) => String(Math.max(0, Math.round(n)));

export function suggestPrompt(req: { target: Macros; dayLeft: Macros; slot: MealSlot; note?: string }): string {
  const t = req.target;
  const d = req.dayLeft;
  const note = req.note?.trim() ? `\nPreferencias del usuario: ${req.note.trim()}` : '';
  return `Eres un nutricionista chileno. Propón 3 ideas distintas para ${SLOT_ES[req.slot]}, con ingredientes fáciles de encontrar en un supermercado chileno.
Meta para ESTA comida: unos ${fmt(t.kcal)} kcal, ${fmt(t.protein)} g de proteína, ${fmt(t.carbs)} g de carbohidratos y ${fmt(t.fat)} g de grasa.
Cada idea debe acercarse a esa meta: es una porción normal de ${SLOT_ES[req.slot]}, no toda la comida del día.
Como referencia, al usuario le quedan en total hoy ${fmt(d.kcal)} kcal; nunca te pases de eso.${note}
Para cada idea da: name, items (cada ingrediente con name, grams, kcal, protein, carbs, fat) y steps (pasos breves de preparación).`;
}

const ITEM_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    grams: { type: 'number' },
    kcal: { type: 'number' },
    protein: { type: 'number' },
    carbs: { type: 'number' },
    fat: { type: 'number' },
  },
  required: ['name', 'grams', 'kcal', 'protein', 'carbs', 'fat'],
};

export const ITEMS_SCHEMA = {
  type: 'object',
  properties: { items: { type: 'array', items: ITEM_SCHEMA } },
  required: ['items'],
};

export const LABEL_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    per100: {
      type: 'object',
      properties: { kcal: { type: 'number' }, protein: { type: 'number' }, carbs: { type: 'number' }, fat: { type: 'number' } },
      required: ['kcal', 'protein', 'carbs', 'fat'],
    },
    servingGrams: { type: 'number' },
  },
  required: ['per100'],
};

export const SUGGESTIONS_SCHEMA = {
  type: 'object',
  properties: {
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          items: { type: 'array', items: ITEM_SCHEMA },
          steps: { type: 'array', items: { type: 'string' } },
        },
        required: ['name', 'items', 'steps'],
      },
    },
  },
  required: ['suggestions'],
};
