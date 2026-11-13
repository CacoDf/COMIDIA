import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { BookMarked, Plus, Sparkles } from 'lucide-react';
import { listSavedMeals } from '../../db/repo';
import type { SavedMeal } from '../../domain/types';
import { Screen } from '../../ui/Screen';
import { BarButton, Button } from '../../ui/Button';
import { ListRow, ListSection } from '../../ui/List';
import { EmptyState } from '../../ui/EmptyState';
import { MealEditor } from './MealEditor';
import { mealSummary } from './mealText';

export default function MealsScreen() {
  const navigate = useNavigate();
  const meals = useLiveQuery(() => listSavedMeals(), []);
  const [editing, setEditing] = useState<SavedMeal | 'new' | null>(null);

  return (
    <Screen
      title="Comidas"
      trailing={
        <BarButton aria-label="Nueva comida" onClick={() => setEditing('new')}>
          <Plus size={24} strokeWidth={2.2} aria-hidden="true" />
        </BarButton>
      }
    >
      <ListSection>
        <ListRow
          leading={<Sparkles size={22} strokeWidth={1.9} />}
          title="Ideas para comer"
          subtitle="Según lo que te queda hoy"
          chevron
          onClick={() => navigate('/sugerencias')}
        />
      </ListSection>

      {meals && meals.length === 0 && (
        <EmptyState
          icon={<BookMarked size={44} strokeWidth={1.5} />}
          title="Aún no tienes comidas guardadas"
          action={<Button variant="tinted" onClick={() => setEditing('new')}>Crear comida</Button>}
        >
          Guarda lo que comes seguido para anotarlo con un toque.
        </EmptyState>
      )}

      {meals && meals.length > 0 && (
        <ListSection header="Mis comidas">
          {meals.map((m) => (
            <ListRow key={m.id} title={m.name} subtitle={mealSummary(m.items)} chevron onClick={() => setEditing(m)} />
          ))}
        </ListSection>
      )}

      {editing && <MealEditor meal={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </Screen>
  );
}
