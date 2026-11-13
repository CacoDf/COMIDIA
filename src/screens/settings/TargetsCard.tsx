import { useState } from 'react';
import { getProfile, saveProfile } from '../../db/repo';
import { useTargets } from '../../state/useTargets';
import { ListRow, ListSection } from '../../ui/List';
import { NumberField } from '../../ui/Field';
import { Button } from '../../ui/Button';
import { fmtG, fmtKcal, MACRO_LABEL } from '../../ui/labels';
import type { Macros, Targets } from '../../domain/types';

const KEYS = ['kcal', 'protein', 'carbs', 'fat'] as const;
const unit = (k: (typeof KEYS)[number]) => (k === 'kcal' ? 'kcal' : 'g');
const fmt = (k: (typeof KEYS)[number], n: number) => (k === 'kcal' ? `${fmtKcal(n)} kcal` : `${fmtG(n)} g`);

function Dot({ k }: { k: (typeof KEYS)[number] }) {
  return <span style={{ width: 10, height: 10, borderRadius: 5, background: `var(--${k})`, display: 'inline-block' }} />;
}

/** Metas diarias. Con `targets` muestra una vista previa; si no, lee las metas guardadas. `editable` permite ajustarlas a mano. */
export function TargetsCard({ targets: preview, editable = false }: { targets?: Targets; editable?: boolean }) {
  const saved = useTargets();
  const t = preview ?? saved;
  const [editing, setEditing] = useState<Macros | null>(null);

  if (!t) return null;

  async function saveManual() {
    const profile = await getProfile();
    if (!profile || !editing) return;
    await saveProfile({ ...profile, manualTargets: editing });
    setEditing(null);
  }

  async function backToAuto() {
    const profile = await getProfile();
    if (!profile) return;
    const { manualTargets: _drop, ...rest } = profile;
    await saveProfile(rest);
  }

  const footer = t.manual
    ? `Metas ajustadas a mano. Tu mantención calculada es ${fmtKcal(t.tdee)} kcal.`
    : t.flooredAtBmr
      ? `Tu meta no baja de tu metabolismo basal (${fmtKcal(t.bmr)} kcal), así que vas a bajar más lento que el ritmo elegido.`
      : `Tu mantención es ${fmtKcal(t.tdee)} kcal al día. Las metas se recalculan cuando registras un peso nuevo.`;

  if (editing) {
    return (
      <ListSection header="Tus metas diarias" footer="Estos valores se usan tal cual hasta que vuelvas al cálculo automático.">
        {KEYS.map((k) => (
          <NumberField
            key={k}
            label={MACRO_LABEL[k]}
            unit={unit(k)}
            initial={Math.round(editing[k])}
            onValueChange={(v) => v !== null && setEditing((e) => (e ? { ...e, [k]: v } : e))}
          />
        ))}
        <div className="inset" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="plain" onClick={() => setEditing(null)}>Cancelar</Button>
          <Button onClick={saveManual}>Guardar metas</Button>
        </div>
      </ListSection>
    );
  }

  return (
    <ListSection header="Tus metas diarias" footer={footer}>
      {KEYS.map((k) => (
        <ListRow key={k} leading={<Dot k={k} />} title={MACRO_LABEL[k]} detail={fmt(k, t[k])} />
      ))}
      {editable && (
        <ListRow
          tone="action"
          title="Ajustar a mano"
          onClick={() => setEditing({ kcal: t.kcal, protein: t.protein, carbs: t.carbs, fat: t.fat })}
        />
      )}
      {editable && t.manual && <ListRow tone="action" title="Volver al cálculo automático" onClick={backToAuto} />}
    </ListSection>
  );
}
