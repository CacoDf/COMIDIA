import { useState } from 'react';
import { Navigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { BookMarked, ChevronLeft } from 'lucide-react';
import { addEntry, listSavedMeals } from '../../db/repo';
import { rescaleItem } from '../../domain/macros';
import type { SavedMeal } from '../../domain/types';
import { Screen } from '../../ui/Screen';
import { BarButton } from '../../ui/Button';
import { ListRow, ListSection } from '../../ui/List';
import { NumberField } from '../../ui/Field';
import { Sheet } from '../../ui/Sheet';
import { EmptyState } from '../../ui/EmptyState';
import { useToast } from '../../ui/Toast';
import { macroLine, mealSummary } from '../meals/mealText';
import { useAddContext } from './useAddContext';

export default function SavedMealsPicker() {
  const { slot, date, backToMenu, backToToday } = useAddContext();
  const toast = useToast();
  const meals = useLiveQuery(() => listSavedMeals(), []);
  const [picked, setPicked] = useState<SavedMeal | null>(null);
  const [factor, setFactor] = useState<number | null>(1);

  if (!slot) return <Navigate to="/" replace />;

  const scaled = picked && factor && factor > 0
    ? picked.items.map((it) => rescaleItem(it, Math.round(it.grams * factor * 10) / 10))
    : null;

  async function confirm() {
    if (!picked || !scaled) return;
    await addEntry({ date, slot: slot!, name: picked.name, items: scaled, source: 'saved' });
    toast.show('Buena, guardado');
    backToToday();
  }

  return (
    <Screen
      title="Mis comidas"
      large={false}
      tabbar={false}
      leading={
        <BarButton onClick={backToMenu}>
          <ChevronLeft size={24} strokeWidth={2.2} aria-hidden="true" /> Atrás
        </BarButton>
      }
    >
      <div style={{ height: 16 }} />
      {meals && meals.length === 0 && (
        <EmptyState icon={<BookMarked size={44} strokeWidth={1.5} />} title="Aún no tienes comidas guardadas">
          Al revisar una comida activa «Guardar también en Mis comidas», o créalas en la pestaña Comidas.
        </EmptyState>
      )}
      {meals && meals.length > 0 && (
        <ListSection>
          {meals.map((m) => (
            <ListRow key={m.id} title={m.name} subtitle={mealSummary(m.items)} onClick={() => { setFactor(1); setPicked(m); }} />
          ))}
        </ListSection>
      )}

      {picked && (
        <Sheet open title={picked.name} onClose={() => setPicked(null)} doneLabel="Agregar" onDone={confirm} doneDisabled={!scaled}>
          <ListSection footer={scaled ? macroLine(scaled) : 'Escribe una cantidad mayor que cero.'}>
            <NumberField label="Porciones" initial={1} onValueChange={setFactor} />
          </ListSection>
          <ListSection header="Ingredientes">
            {(scaled ?? picked.items).map((it, i) => (
              <ListRow key={i} title={it.name} detail={`${Math.round(it.grams)} g`} />
            ))}
          </ListSection>
        </Sheet>
      )}
    </Screen>
  );
}
