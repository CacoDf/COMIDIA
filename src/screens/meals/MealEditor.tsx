import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { deleteMeal, saveMeal } from '../../db/repo';
import { searchLocal } from '../../services/foodSearch';
import type { Food, Item, SavedMeal } from '../../domain/types';
import { Sheet } from '../../ui/Sheet';
import { ListRow, ListSection } from '../../ui/List';
import { Field } from '../../ui/Field';
import { fmtG1, fmtKcal } from '../../ui/labels';
import { QuantitySheet } from '../add/QuantitySheet';
import { ItemSheet } from '../review/ItemSheet';
import { macroLine } from './mealText';

/** Crea o edita una comida guardada. */
export function MealEditor({ meal, onClose }: { meal?: SavedMeal; onClose: () => void }) {
  const [name, setName] = useState(meal?.name ?? '');
  const [items, setItems] = useState<Item[]>(meal?.items ?? []);
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [picked, setPicked] = useState<Food | null>(null);
  const [editing, setEditing] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    searchLocal(q).then((r) => alive && setResults(r.slice(0, 12)));
    return () => { alive = false; };
  }, [q]);

  const valid = name.trim() !== '' && items.length > 0;

  async function save() {
    if (!valid) return;
    await saveMeal({ ...(meal ? { id: meal.id } : {}), name: name.trim(), items, ...(meal?.steps ? { steps: meal.steps } : {}) });
    onClose();
  }

  async function remove() {
    if (!meal) return;
    await deleteMeal(meal.id);
    onClose();
  }

  return (
    <Sheet open title={meal ? meal.name : 'Nueva comida'} onClose={onClose} doneLabel="Guardar" onDone={save} doneDisabled={!valid}>
      <ListSection>
        <Field label="Nombre" value={name} onChange={setName} placeholder="Ej. Mi avena" />
      </ListSection>

      <ListSection header="Ingredientes" footer={items.length ? macroLine(items) : 'Agrega al menos un ingrediente.'}>
        {items.map((it, i) => (
          <ListRow key={i} title={it.name} subtitle={`${fmtG1(it.grams)} g`} detail={fmtKcal(it.macros.kcal)} chevron onClick={() => setEditing(i)} />
        ))}
        {!searching && (
          <ListRow tone="action" leading={<Plus size={20} strokeWidth={2.4} />} title="Agregar ingrediente" onClick={() => setSearching(true)} />
        )}
      </ListSection>

      {searching && (
        <>
          <div className="searchfield" style={{ marginTop: -12 }}>
            <Search size={17} strokeWidth={2.2} aria-hidden="true" />
            <input type="search" aria-label="Buscar ingrediente" placeholder="Arroz, pollo, palta…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          </div>
          {results.length > 0 && (
            <ListSection>
              {results.map((f) => (
                <ListRow key={f.id} title={f.name} subtitle={`${fmtKcal(f.per100.kcal)} kcal por 100 g`} onClick={() => setPicked(f)} />
              ))}
            </ListSection>
          )}
        </>
      )}

      {meal?.steps && meal.steps.length > 0 && (
        <ListSection header="Preparación">
          <ol className="steps">{meal.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </ListSection>
      )}

      {meal && (
        <ListSection>
          <ListRow tone="destructive" title="Borrar comida" onClick={remove} />
        </ListSection>
      )}

      {picked && (
        <QuantitySheet
          food={picked}
          onClose={() => setPicked(null)}
          onConfirm={(it) => { setItems((x) => [...x, it]); setPicked(null); setSearching(false); setQ(''); }}
        />
      )}
      {editing !== null && items[editing] && (
        <ItemSheet
          item={items[editing]}
          onClose={() => setEditing(null)}
          onSave={(it) => { setItems((x) => x.map((y, i) => (i === editing ? it : y))); setEditing(null); }}
          onRemove={() => { setItems((x) => x.filter((_, i) => i !== editing)); setEditing(null); }}
        />
      )}
    </Sheet>
  );
}
