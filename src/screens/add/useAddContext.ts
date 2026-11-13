import { useNavigate, useParams, useSearchParams } from 'react-router';
import { todayLocal } from '../../domain/dates';
import { MEAL_SLOTS, type MealSlot } from '../../domain/types';

/** Comida y fecha a las que se está agregando, desde la ruta /agregar/:slot?d=. */
export function useAddContext() {
  const { slot: rawSlot } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const today = todayLocal();
  const raw = params.get('d');
  const date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) && raw <= today ? raw : today;
  const qs = date === today ? '' : `?d=${date}`;
  const slot = MEAL_SLOTS.includes(rawSlot as MealSlot) ? (rawSlot as MealSlot) : null;
  return {
    slot,
    date,
    qs,
    /** Ruta hermana conservando la fecha, ej. to('texto') → /agregar/lunch/texto?d=... */
    to: (sub: string) => `/agregar/${slot}${sub ? `/${sub}` : ''}${qs}`,
    backToMenu: () => navigate(`/agregar/${slot}${qs}`),
    backToToday: () => navigate(`/${qs}`, { replace: true }),
  };
}
