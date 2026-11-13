import { useState } from 'react';
import { macrosForGrams } from '../../domain/macros';
import type { Food, Item } from '../../domain/types';
import { Sheet } from '../../ui/Sheet';
import { ListSection } from '../../ui/List';
import { ChoiceList } from '../../ui/ChoiceList';
import { NumberField } from '../../ui/Field';
import { fmtG, fmtG1, fmtKcal } from '../../ui/labels';

const GRAMS = '__g';

/** Elige cuánto comiste de un alimento: en porciones o en gramos. */
export function QuantitySheet({ food, onClose, onConfirm, confirmLabel = 'Agregar' }: {
  food: Food;
  onClose: () => void;
  onConfirm: (item: Item) => void;
  confirmLabel?: string;
}) {
  const portions = food.portions.filter((p) => p.label !== '100 g' && p.grams > 0);
  const [portion, setPortion] = useState<string>(portions[0] ? portions[0].label : GRAMS);
  const [qty, setQty] = useState<number | null>(portion === GRAMS ? 100 : 1);

  const per = portion === GRAMS ? 1 : (portions.find((p) => p.label === portion)?.grams ?? 1);
  const grams = qty !== null && qty > 0 ? Math.round(qty * per * 10) / 10 : null;
  const m = grams !== null ? macrosForGrams(food.per100, grams) : null;

  function pick(next: string) {
    setPortion(next);
    setQty(next === GRAMS ? 100 : 1);
  }

  return (
    <Sheet
      open
      title={food.name}
      onClose={onClose}
      doneLabel={confirmLabel}
      doneDisabled={grams === null}
      onDone={() => grams !== null && m && onConfirm({ name: food.name, grams, macros: m, foodId: food.id })}
    >
      <ListSection
        header="¿Cuánto comiste?"
        footer={
          m && grams !== null
            ? `${fmtG1(grams)} g · ${fmtKcal(m.kcal)} kcal · P ${fmtG1(m.protein)} · C ${fmtG1(m.carbs)} · G ${fmtG1(m.fat)} g`
            : 'Escribe una cantidad mayor que cero.'
        }
      >
        <NumberField
          key={portion}
          label="Cantidad"
          unit={portion === GRAMS ? 'g' : portion.toLowerCase()}
          initial={portion === GRAMS ? 100 : 1}
          onValueChange={setQty}
        />
      </ListSection>
      <ListSection header="Medida">
        <ChoiceList
          label="Medida"
          value={portion}
          onChange={pick}
          options={[
            ...portions.map((p) => ({ value: p.label, title: p.label.charAt(0).toUpperCase() + p.label.slice(1), detail: `${fmtG(p.grams)} g` })),
            { value: GRAMS, title: 'Gramos', detail: `${fmtKcal(food.per100.kcal)} kcal por 100 g` },
          ]}
        />
      </ListSection>
    </Sheet>
  );
}
