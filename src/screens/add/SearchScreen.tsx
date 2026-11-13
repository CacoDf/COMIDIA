import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { ChevronLeft, Globe, Plus, Search } from 'lucide-react';
import { addEntry, upsertFood } from '../../db/repo';
import { searchLocal, searchOnline } from '../../services/foodSearch';
import { OffError } from '../../services/openFoodFacts';
import type { Food, Item } from '../../domain/types';
import { Screen } from '../../ui/Screen';
import { BarButton } from '../../ui/Button';
import { ListRow, ListSection } from '../../ui/List';
import { useToast } from '../../ui/Toast';
import { fmtKcal } from '../../ui/labels';
import { QuantitySheet } from './QuantitySheet';
import { ManualFoodForm } from './ManualFoodForm';
import { useAddContext } from './useAddContext';

export function offErrorMessage(e: unknown): string {
  if (e instanceof OffError && e.kind === 'rate-limit') return 'Open Food Facts está recibiendo muchas búsquedas. Prueba de nuevo en un minuto.';
  if (e instanceof OffError && e.kind === 'offline') return 'Sin conexión. Igual puedes buscar en los alimentos de arriba.';
  return 'No se pudo buscar en productos. Prueba de nuevo.';
}

const foodSubtitle = (f: Food) => [f.brand, `${fmtKcal(f.per100.kcal)} kcal por 100 g`].filter(Boolean).join(' · ');

export default function SearchScreen() {
  const { slot, date, backToMenu, backToToday } = useAddContext();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [local, setLocal] = useState<Food[]>([]);
  const [online, setOnline] = useState<Food[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState<Food | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let alive = true;
    searchLocal(q).then((r) => alive && setLocal(r));
    setOnline(null);
    setError('');
    return () => { alive = false; };
  }, [q]);

  if (!slot) return <Navigate to="/" replace />;

  async function goOnline() {
    setSearching(true);
    setError('');
    try {
      setOnline(await searchOnline(q.trim()));
    } catch (e) {
      setError(offErrorMessage(e));
    }
    setSearching(false);
  }

  async function choose(f: Food, fromOnline: boolean) {
    if (fromOnline) await upsertFood(f);
    setPicked(f);
  }

  async function confirm(item: Item) {
    await addEntry({ date, slot: slot!, name: item.name, items: [item], source: 'search' });
    toast.show('Buena, guardado');
    backToToday();
  }

  const term = q.trim();

  return (
    <Screen
      title="Buscar"
      large={false}
      tabbar={false}
      leading={
        <BarButton onClick={backToMenu}>
          <ChevronLeft size={24} strokeWidth={2.2} aria-hidden="true" /> Atrás
        </BarButton>
      }
    >
      <div className="searchfield">
        <Search size={17} strokeWidth={2.2} aria-hidden="true" />
        <input
          type="search"
          aria-label="Buscar alimento"
          placeholder="Plátano, leche, marraqueta…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          enterKeyHint="search"
        />
      </div>

      {local.length > 0 && (
        <ListSection header="Alimentos">
          {local.map((f) => (
            <ListRow key={f.id} title={f.name} subtitle={foodSubtitle(f)} chevron onClick={() => choose(f, false)} />
          ))}
        </ListSection>
      )}

      {term.length >= 2 && (
        <ListSection header={online ? 'Productos de Open Food Facts' : undefined} footer={error || (online && online.length === 0 ? 'No encontramos productos con ese nombre.' : undefined)}>
          {online?.map((f) => (
            <ListRow key={f.id} title={f.name} subtitle={foodSubtitle(f)} chevron onClick={() => choose(f, true)} />
          ))}
          {!online && (
            <ListRow
              tone="action"
              leading={<Globe size={20} strokeWidth={2} />}
              title={searching ? 'Buscando…' : `Buscar «${term}» en productos`}
              disabled={searching}
              onClick={goOnline}
            />
          )}
        </ListSection>
      )}

      <ListSection footer="Si no lo encuentras, créalo con los valores de su etiqueta.">
        <ListRow tone="action" leading={<Plus size={20} strokeWidth={2.4} />} title="Crear alimento" onClick={() => setCreating(true)} />
      </ListSection>

      {creating && (
        <ManualFoodForm
          initial={{ name: term }}
          onClose={() => setCreating(false)}
          onSaved={(f) => { setCreating(false); setPicked(f); }}
        />
      )}
      {picked && <QuantitySheet food={picked} onClose={() => setPicked(null)} onConfirm={confirm} />}
    </Screen>
  );
}
