import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings } from '../db/repo';
import type { AiConfig } from '../services/gemini';

export const FALLBACK_MODEL = 'gemini-flash-lite-latest';

/** Configuración de Gemini guardada en el teléfono. `loading` mientras se lee. */
export function useAi(): { config?: AiConfig; ready: boolean; loading: boolean } {
  const settings = useLiveQuery(() => getSettings(), []);
  if (!settings) return { ready: false, loading: true };
  if (!settings.geminiKey) return { ready: false, loading: false };
  return { config: { key: settings.geminiKey, model: settings.geminiModel ?? FALLBACK_MODEL }, ready: true, loading: false };
}
