import { z } from 'zod';
import type { Item, Macros, MealSlot } from '../domain/types';
import { MacrosSchema } from '../domain/schemas';
import {
  ITEMS_SCHEMA, LABEL_PROMPT, LABEL_SCHEMA, photoPrompt, refinePrompt, suggestPrompt, SUGGESTIONS_SCHEMA, textPrompt,
} from './geminiPrompts';

const API = 'https://generativelanguage.googleapis.com/v1beta';

export type AiConfig = { key: string; model: string };
export type Suggestion = { name: string; items: Item[]; steps: string[] };
export type LabelReading = { name?: string; per100: Macros; servingGrams?: number };

export type AiErrorKind = 'no-key' | 'bad-key' | 'quota' | 'offline' | 'invalid-response' | 'no-food' | 'unknown';

export class AiError extends Error {
  kind: AiErrorKind;
  constructor(kind: AiErrorKind, message?: string) {
    super(message ?? kind);
    this.name = 'AiError';
    this.kind = kind;
  }
}

// Respuestas esperadas

const nonNeg = z.number().finite().min(0);
const RawItem = z.object({
  name: z.string().trim().min(1),
  grams: z.number().finite().positive(),
  kcal: nonNeg,
  protein: nonNeg,
  carbs: nonNeg,
  fat: nonNeg,
});
const ItemsResponse = z.object({ items: z.array(RawItem) });
const LabelResponse = z.object({
  name: z.string().optional(),
  per100: MacrosSchema,
  servingGrams: z.number().positive().optional(),
});
const SuggestionsResponse = z.object({
  suggestions: z.array(z.object({ name: z.string().min(1), items: z.array(RawItem).min(1), steps: z.array(z.string()) })),
});

const toItem = (r: z.infer<typeof RawItem>): Item => ({
  name: r.name,
  grams: r.grams,
  macros: { kcal: r.kcal, protein: r.protein, carbs: r.carbs, fat: r.fat },
});

// Transporte

async function request(key: string, path: string, init?: RequestInit): Promise<unknown> {
  if (!key.trim()) throw new AiError('no-key');
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...init,
      headers: { 'x-goog-api-key': key.trim(), 'Content-Type': 'application/json' },
    });
  } catch (e) {
    throw new AiError('offline', String(e));
  }
  const body: unknown = await res.json().catch(() => undefined);
  if (res.ok) return body;
  const message = (body as { error?: { message?: string } } | undefined)?.error?.message ?? `HTTP ${res.status}`;
  if (res.status === 429) throw new AiError('quota', message);
  if (res.status === 401 || res.status === 403) throw new AiError('bad-key', message);
  if (res.status === 400 && /api key/i.test(message)) throw new AiError('bad-key', message);
  throw new AiError('unknown', message);
}

async function generate<T>(cfg: AiConfig, parts: unknown[], schema: object, parser: z.ZodType<T>): Promise<T> {
  const body = await request(cfg.key, `/models/${encodeURIComponent(cfg.model)}:generateContent`, {
    method: 'POST',
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: { responseMimeType: 'application/json', responseJsonSchema: schema, temperature: 0.2 },
    }),
  });
  const text = (body as { candidates?: { content?: { parts?: { text?: string }[] } }[] })?.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? '')
    .join('');
  if (!text) throw new AiError('invalid-response', 'Respuesta vacía');
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new AiError('invalid-response', 'No es JSON');
  }
  const parsed = parser.safeParse(json);
  if (!parsed.success) throw new AiError('invalid-response', parsed.error.message);
  return parsed.data;
}

function itemsOrNoFood(r: z.infer<typeof ItemsResponse>): Item[] {
  if (r.items.length === 0) throw new AiError('no-food');
  return r.items.map(toItem);
}

// API pública

export async function listModels(key: string): Promise<string[]> {
  const body = (await request(key, '/models?pageSize=200')) as {
    models?: { name: string; supportedGenerationMethods?: string[] }[];
  };
  return (body.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => m.name.replace(/^models\//, ''));
}

export async function testKey(key: string): Promise<void> {
  await listModels(key);
}

const EXCLUDED = /preview|exp|tts|image|live/;

function version(name: string): number[] {
  const m = name.match(/(\d+(?:\.\d+)*)/);
  return m ? m[1].split('.').map(Number) : [0];
}

function compareVersionDesc(a: string, b: string): number {
  const va = version(a);
  const vb = version(b);
  for (let i = 0; i < Math.max(va.length, vb.length); i++) {
    const d = (vb[i] ?? 0) - (va[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

export function pickDefaultModel(models: string[]): string | undefined {
  if (models.length === 0) return undefined;
  const stable = models.filter((m) => !EXCLUDED.test(m));
  const pool = stable.length > 0 ? stable : models;
  const best = (pred: (m: string) => boolean) => pool.filter(pred).sort(compareVersionDesc)[0];
  return best((m) => m.includes('flash-lite')) ?? best((m) => m.includes('flash')) ?? pool[0];
}

export async function estimateFromText(cfg: AiConfig, text: string): Promise<Item[]> {
  return itemsOrNoFood(await generate(cfg, [{ text: textPrompt(text) }], ITEMS_SCHEMA, ItemsResponse));
}

export async function estimateFromPhoto(cfg: AiConfig, jpegBase64: string, note?: string): Promise<Item[]> {
  const parts = [{ text: photoPrompt(note) }, { inlineData: { mimeType: 'image/jpeg', data: jpegBase64 } }];
  return itemsOrNoFood(await generate(cfg, parts, ITEMS_SCHEMA, ItemsResponse));
}

/** Rehace la estimación con la corrección del usuario ("faltó la mayonesa", "no tiene queso"). */
export async function refineEstimate(
  cfg: AiConfig,
  req: { items: Item[]; correction: string; photoB64?: string; text?: string },
): Promise<Item[]> {
  const parts: unknown[] = [{ text: refinePrompt({ items: req.items, correction: req.correction, text: req.text, hasPhoto: !!req.photoB64 }) }];
  if (req.photoB64) parts.push({ inlineData: { mimeType: 'image/jpeg', data: req.photoB64 } });
  return itemsOrNoFood(await generate(cfg, parts, ITEMS_SCHEMA, ItemsResponse));
}

export async function readLabel(cfg: AiConfig, jpegBase64: string): Promise<LabelReading> {
  const parts = [{ text: LABEL_PROMPT }, { inlineData: { mimeType: 'image/jpeg', data: jpegBase64 } }];
  const r = await generate(cfg, parts, LABEL_SCHEMA, LabelResponse);
  return {
    ...(r.name?.trim() ? { name: r.name.trim() } : {}),
    per100: r.per100,
    ...(r.servingGrams ? { servingGrams: r.servingGrams } : {}),
  };
}

export async function suggestMeals(
  cfg: AiConfig,
  req: { remaining: Macros; slot: MealSlot; note?: string },
): Promise<Suggestion[]> {
  const r = await generate(cfg, [{ text: suggestPrompt(req) }], SUGGESTIONS_SCHEMA, SuggestionsResponse);
  if (r.suggestions.length === 0) throw new AiError('invalid-response', 'Sin sugerencias');
  return r.suggestions.slice(0, 3).map((s) => ({ name: s.name, steps: s.steps, items: s.items.map(toItem) }));
}
