import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getProfile, latestWeight, listWeights, setWeight } from '../../db/repo';
import { todayLocal } from '../../domain/dates';
import { targetsFor, useTargets } from '../../state/useTargets';
import { Screen } from '../../ui/Screen';
import { Button } from '../../ui/Button';
import { ListSection } from '../../ui/List';
import { NumberField } from '../../ui/Field';
import { useToast } from '../../ui/Toast';
import { fmtKcal } from '../../ui/labels';
import { WeightChart } from './WeightChart';
import { WeeklySummary } from './WeeklySummary';

export default function ProgressScreen() {
  const toast = useToast();
  const today = todayLocal();
  const weights = useLiveQuery(() => listWeights(), []);
  const targets = useTargets();
  const todays = weights?.find((w) => w.date === today);
  const [kg, setKg] = useState<number | null>(null);
  const [change, setChange] = useState<{ from: number; to: number } | null>(null);

  async function register() {
    if (kg === null || kg < 30 || kg > 350) return;
    const [profile, prev] = await Promise.all([getProfile(), latestWeight()]);
    await setWeight(today, kg);
    toast.show('Peso registrado');
    if (profile && prev && !profile.manualTargets) {
      const before = targetsFor(profile, prev.kg).kcal;
      const after = targetsFor(profile, kg).kcal;
      setChange(before !== after ? { from: before, to: after } : null);
    }
  }

  return (
    <Screen title="Progreso">
      {change && (
        <section role="status" aria-label="Tus metas cambiaron" className="group">
          <div className="group__body notice">
            <p className="t-headline">Tus metas cambiaron</p>
            <p className="t-subhead c-secondary" style={{ margin: '2px 0 0' }}>
              Con tu peso nuevo, tu meta pasa de {fmtKcal(change.from)} a {fmtKcal(change.to)} kcal al día.
            </p>
          </div>
        </section>
      )}

      <ListSection header="Peso">
        {weights && <WeightChart weights={weights} />}
        <NumberField
          key={todays?.kg ?? 'none'}
          label="Peso de hoy"
          unit="kg"
          placeholder="70"
          initial={todays?.kg}
          onValueChange={setKg}
        />
        <div className="inset" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="tinted" onClick={register} disabled={kg === null || kg < 30 || kg > 350}>Registrar</Button>
        </div>
      </ListSection>

      {targets && <WeeklySummary target={targets} />}
    </Screen>
  );
}
