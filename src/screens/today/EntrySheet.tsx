import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useDraft } from '../../state/DraftContext';
import { copyEntry, deleteEntry, restoreEntry, saveMeal, updateEntry } from '../../db/repo';
import { sumMacros } from '../../domain/macros';
import { dayTitle } from '../../domain/dates';
import { MEAL_SLOTS, type LogEntry, type MealSlot } from '../../domain/types';
import { Sheet } from '../../ui/Sheet';
import { ListRow, ListSection } from '../../ui/List';
import { ChoiceList } from '../../ui/ChoiceList';
import { Field } from '../../ui/Field';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/Toast';
import { fmtG, fmtKcal, SLOT_LABEL } from '../../ui/labels';

const macroLine = (m: { protein: number; carbs: number; fat: number }) =>
  `P ${fmtG(m.protein)} · C ${fmtG(m.carbs)} · G ${fmtG(m.fat)} g`;

/** Detalle de una entrada del diario: ingredientes, mover, copiar y borrar. */
export function EntrySheet({ entry, onClose }: { entry: LogEntry | null; onClose: () => void }) {
  const toast = useToast();
  const navigate = useNavigate();
  const { setDraft } = useDraft();
  const [copyDate, setCopyDate] = useState('');
  if (!entry) return null;
  const total = sumMacros(entry.items.map((i) => i.macros));

  function edit() {
    const e = entry!;
    setDraft({ date: e.date, slot: e.slot, name: e.name, items: e.items, source: e.source, entryId: e.id });
    onClose();
    navigate('/revision');
  }

  async function keep() {
    await saveMeal({ name: entry!.name, items: entry!.items });
    toast.show('Guardado en Mis comidas');
    onClose();
  }

  async function move(slot: MealSlot) {
    await updateEntry(entry!.id, { slot });
    toast.show(`Movido a ${SLOT_LABEL[slot]}`);
    onClose();
  }

  async function copy() {
    if (!copyDate) return;
    await copyEntry(entry!.id, copyDate, entry!.slot);
    toast.show(`Copiado a ${dayTitle(copyDate).toLowerCase()}`);
    setCopyDate('');
    onClose();
  }

  async function remove() {
    const original = entry!;
    await deleteEntry(original.id);
    onClose();
    toast.show(`${original.name} borrado`, { label: 'Deshacer', onClick: () => void restoreEntry(original) });
  }

  return (
    <Sheet open title={entry.name} onClose={onClose} closeLabel="Cerrar">
      <ListSection header="Ingredientes" footer={`Total: ${fmtKcal(total.kcal)} kcal · ${macroLine(total)}`}>
        {entry.items.map((it, i) => (
          <ListRow key={i} title={it.name} subtitle={`${fmtG(it.grams)} g · ${macroLine(it.macros)}`} detail={`${fmtKcal(it.macros.kcal)}`} />
        ))}
        <ListRow tone="action" title="Editar" onClick={edit} />
        <ListRow tone="action" title="Guardar en Mis comidas" onClick={keep} />
      </ListSection>

      <ListSection header="Mover a">
        <ChoiceList
          label="Mover a"
          value={entry.slot}
          options={MEAL_SLOTS.map((s) => ({ value: s, title: SLOT_LABEL[s] }))}
          onChange={(s) => s !== entry.slot && void move(s)}
        />
      </ListSection>

      <ListSection header="Copiar a otro día">
        <Field label="Día" type="date" value={copyDate} onChange={setCopyDate} />
        <div className="inset" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="tinted" onClick={copy} disabled={!copyDate}>Copiar</Button>
        </div>
      </ListSection>

      <ListSection>
        <ListRow tone="destructive" title="Borrar" onClick={remove} />
      </ListSection>
    </Sheet>
  );
}
