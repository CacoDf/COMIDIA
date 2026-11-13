import { useState } from 'react';
import { upsertFood } from '../../db/repo';
import type { Food, Macros } from '../../domain/types';
import { Sheet } from '../../ui/Sheet';
import { ListSection } from '../../ui/List';
import { Field, NumberField } from '../../ui/Field';

type Draft = { name: string; barcode?: string; per100: Partial<Macros>; serving: number | null };

/** Crea un alimento propio con valores por 100 g. También sirve para corregir lo que leyó la IA de una etiqueta. */
export function ManualFoodForm({ initial, onClose, onSaved, title = 'Nuevo alimento' }: {
  initial?: Partial<Draft>;
  onClose: () => void;
  onSaved: (food: Food) => void;
  title?: string;
}) {
  const [d, setD] = useState<Draft>({ name: '', per100: {}, serving: null, ...initial });
  const p = d.per100;
  const valid = d.name.trim() !== '' && [p.kcal, p.protein, p.carbs, p.fat].every((v) => typeof v === 'number' && v >= 0)
    && (p.protein ?? 0) + (p.carbs ?? 0) + (p.fat ?? 0) <= 100.5;

  const setMacro = (k: keyof Macros) => (v: number | null) => setD((x) => ({ ...x, per100: { ...x.per100, [k]: v ?? undefined } }));

  async function save() {
    if (!valid) return;
    const food: Food = {
      id: d.barcode ? `label:${d.barcode}` : `custom:${crypto.randomUUID()}`,
      name: d.name.trim(),
      ...(d.barcode ? { barcode: d.barcode } : {}),
      per100: p as Macros,
      portions: [{ label: '100 g', grams: 100 }, ...(d.serving && d.serving > 0 ? [{ label: 'Porción', grams: d.serving }] : [])],
      source: d.barcode ? 'label' : 'custom',
      updatedAt: Date.now(),
    };
    await upsertFood(food);
    onSaved(food);
  }

  return (
    <Sheet open title={title} onClose={onClose} doneLabel="Guardar" onDone={save} doneDisabled={!valid}>
      <ListSection>
        <Field label="Nombre" value={d.name} onChange={(name) => setD((x) => ({ ...x, name }))} placeholder="Ej. Sopaipilla" />
      </ListSection>
      <ListSection header="Por 100 g" footer="Copia los valores de la tabla nutricional, columna 100 g.">
        <NumberField label="Calorías" unit="kcal" initial={p.kcal} onValueChange={setMacro('kcal')} />
        <NumberField label="Proteína" unit="g" initial={p.protein} onValueChange={setMacro('protein')} />
        <NumberField label="Carbos" unit="g" initial={p.carbs} onValueChange={setMacro('carbs')} />
        <NumberField label="Grasa" unit="g" initial={p.fat} onValueChange={setMacro('fat')} />
      </ListSection>
      <ListSection footer="Opcional: cuántos gramos trae una porción.">
        <NumberField label="Porción" unit="g" initial={d.serving ?? undefined} onValueChange={(serving) => setD((x) => ({ ...x, serving }))} />
      </ListSection>
    </Sheet>
  );
}
