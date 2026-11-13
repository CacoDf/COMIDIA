import type { AiErrorKind } from '../services/gemini';

const MESSAGES: Record<AiErrorKind, string> = {
  'no-key': 'Falta tu key de Gemini. Agrégala en Ajustes.',
  'bad-key': 'Google rechazó la key. Revísala en Ajustes.',
  quota: 'Llegaste al límite de la cuota gratis. Si hiciste varias consultas seguidas, espera un minuto; si no, se renueva mañana. Mientras, puedes buscar o escanear.',
  offline: 'Sin conexión. Prueba de nuevo cuando tengas internet.',
  'invalid-response': 'La IA respondió algo que no se pudo leer. Prueba de nuevo.',
  'no-food': 'No encontré comida ahí. Prueba describiéndolo de otra forma.',
  unknown: 'Algo falló con la IA. Prueba de nuevo.',
};

export function aiErrorMessage(kind: AiErrorKind): string {
  return MESSAGES[kind];
}
