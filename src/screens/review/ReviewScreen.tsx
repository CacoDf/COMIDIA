import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { addEntry, saveMeal, updateEntry } from '../../db/repo';
import { sumMacros } from '../../domain/macros';
import { todayLocal } from '../../domain/dates';
import { MEAL_SLOTS, type Item } from '../../domain/types';
import { useDraft } from '../../state/DraftContext';
import { Screen } from '../../ui/Screen';
import { BarButton, Button } from '../../ui/Button';
import { ListRow, ListSection } from '../../ui/List';
import { Field } from '../../ui/Field';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { SwitchRow } from '../../ui/Switch';
import { useToast } from '../../ui/Toast';
import { fmtG, fmtG1, fmtKcal, SLOT_LABEL } from '../../ui/labels';
import { ItemSheet } from './ItemSheet';

const SHORT_SLOT = { breakfast: 'Desayuno', lunch: 'Almuerzo', dinner: 'Cena', snacks: 'Colación' } as const;

export default function ReviewScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const { draft, setDraft, clear } = useDraft();
  const [editing, setEditing] = useState<number | null>(null);
  const [alsoSave, setAlsoSave] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!draft) return <Navigate to="/" replace />;
  const d = draft;
  const total = sumMacros(d.items.map((i) => i.macros));
  const qs = d.date === todayLocal() ? '' : `?d=${d.date}`;
  const fromAi = d.source === 'text' || d.source === 'photo' || d.source === 'suggestion';

  const setItems = (items: Item[]) => setDraft({ ...d, items });

  async function save() {
    setSaving(true);
    const name = d.name.trim() || SLOT_LABEL[d.slot];
    if (d.entryId) {
      await updateEntry(d.entryId, { name, slot: d.slot, items: d.items, date: d.date });
    } else {
      await addEntry({ date: d.date, slot: d.slot, name, items: d.items, source: d.source });
    }
    if (alsoSave) await saveMeal({ name, items: d.items, ...(d.steps?.length ? { steps: d.steps } : {}) });
    toast.show(alsoSave ? 'Buena, guardado y agregado a Mis comidas' : 'Buena, guardado');
    clear();
    navigate(`/${qs}`, { replace: true });
  }

  return (
    <Screen
      title={d.entryId ? 'Editar' : 'Revisión'}
      large={false}
      tabbar={false}
      leading={<BarButton onClick={() => navigate(-1)}>Cancelar</BarButton>}
    >
      <div style={{ height: 16 }} />
      <ListSection>
        <Field label="Nombre" value={d.name} onChange={(name) => setDraft({ ...d, name })} />
        <div className="inset">
          <SegmentedControl
            label="Comida"
            value={d.slot}
            options={MEAL_SLOTS.map((s) => ({ value: s, label: SHORT_SLOT[s] }))}
            onChange={(slot) => setDraft({ ...d, slot })}
          />
        </div>
      </ListSection>

      <ListSection
        header="Ingredientes"
        footer={fromAi ? 'Es una estimación de la IA. Toca un ingrediente para corregir la cantidad.' : 'Toca un ingrediente para cambiarlo.'}
      >
        {d.items.map((it, i) => (
          <ListRow
            key={i}
            title={it.name}
            subtitle={`${fmtG1(it.grams)} g · P ${fmtG(it.macros.protein)} · C ${fmtG(it.macros.carbs)} · G ${fmtG(it.macros.fat)} g`}
            detail={fmtKcal(it.macros.kcal)}
            chevron
            onClick={() => setEditing(i)}
          />
        ))}
        {d.items.length === 0 && <ListRow title={<span className="c-secondary">Sin ingredientes</span>} />}
      </ListSection>

      <ListSection header="Total">
        <ListRow
          title={<span className="t-headline">{fmtKcal(total.kcal)} kcal</span>}
          detail={`P ${fmtG(total.protein)} · C ${fmtG(total.carbs)} · G ${fmtG(total.fat)} g`}
        />
      </ListSection>

      {!d.entryId && (
        <ListSection>
          <SwitchRow label="Guardar también en Mis comidas" checked={alsoSave} onChange={setAlsoSave} />
        </ListSection>
      )}

      <Button size="large" onClick={save} disabled={d.items.length === 0} loading={saving}>Guardar</Button>

      {editing !== null && d.items[editing] && (
        <ItemSheet
          item={d.items[editing]}
          onClose={() => setEditing(null)}
          onSave={(it) => { setItems(d.items.map((x, i) => (i === editing ? it : x))); setEditing(null); }}
          onRemove={() => { setItems(d.items.filter((_, i) => i !== editing)); setEditing(null); }}
        />
      )}
    </Screen>
  );
}
