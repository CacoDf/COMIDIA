import { useState } from 'react';
import { rescaleItem } from '../../domain/macros';
import type { Item, Macros } from '../../domain/types';
import { Sheet } from '../../ui/Sheet';
import { ListRow, ListSection } from '../../ui/List';
import { Field, NumberField } from '../../ui/Field';

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Edita un ingrediente: cambiar los gramos escala los macros; un macro escrito a mano se respeta. */
export function ItemSheet({ item: initial, onClose, onSave, onRemove }: {
  item: Item;
  onClose: () => void;
  onSave: (item: Item) => void;
  onRemove: () => void;
}) {
  const [item, setItem] = useState(initial);
  const [version, setVersion] = useState(0);

  function setGrams(g: number | null) {
    if (g === null || g <= 0) return;
    setItem((cur) => ({ ...rescaleItem(cur, g), name: cur.name }));
    setVersion((v) => v + 1);
  }

  const setMacro = (k: keyof Macros) => (v: number | null) =>
    v !== null && setItem((cur) => ({ ...cur, macros: { ...cur.macros, [k]: v } }));

  const valid = item.name.trim() !== '' && item.grams > 0;

  return (
    <Sheet open title={initial.name} onClose={onClose} doneLabel="Listo" doneDisabled={!valid} onDone={() => onSave({ ...item, name: item.name.trim() })}>
      <ListSection>
        <Field label="Nombre" value={item.name} onChange={(name) => setItem((cur) => ({ ...cur, name }))} />
        <NumberField label="Gramos" unit="g" initial={round1(item.grams)} onValueChange={setGrams} />
      </ListSection>
      <ListSection header="Aporta" footer="Al cambiar los gramos, los valores se ajustan solos.">
        <NumberField key={`k${version}`} label="Calorías" unit="kcal" initial={Math.round(item.macros.kcal)} onValueChange={setMacro('kcal')} />
        <NumberField key={`p${version}`} label="Proteína" unit="g" initial={round1(item.macros.protein)} onValueChange={setMacro('protein')} />
        <NumberField key={`c${version}`} label="Carbos" unit="g" initial={round1(item.macros.carbs)} onValueChange={setMacro('carbs')} />
        <NumberField key={`f${version}`} label="Grasa" unit="g" initial={round1(item.macros.fat)} onValueChange={setMacro('fat')} />
      </ListSection>
      <ListSection>
        <ListRow tone="destructive" title="Quitar ingrediente" onClick={onRemove} />
      </ListSection>
    </Sheet>
  );
}
