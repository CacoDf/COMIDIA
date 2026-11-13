import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { listEntriesInRange } from '../../db/repo';
import { addDays, todayLocal, weekRange } from '../../domain/dates';
import { weeklyAverage } from '../../domain/weekly';
import type { Macros } from '../../domain/types';
import { BarButton } from '../../ui/Button';
import { ProgressBar } from '../../ui/ProgressBar';
import { fmtG, fmtKcal, MACRO_LABEL } from '../../ui/labels';

const KEYS = ['kcal', 'protein', 'carbs', 'fat'] as const;
const rangeFmt = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' });
const pretty = (d: string) => {
  const [y, m, day] = d.split('-').map(Number);
  return rangeFmt.format(new Date(y, m - 1, day, 12)).replace('.', '');
};

export function WeeklySummary({ target }: { target: Macros }) {
  const thisWeek = weekRange(todayLocal()).from;
  const [from, setFrom] = useState(thisWeek);
  const to = addDays(from, 6);
  const entries = useLiveQuery(() => listEntriesInRange(from, to), [from, to]);
  const { daysLogged, average } = weeklyAverage(entries ?? []);
  const title = from === thisWeek ? 'Esta semana' : `Semana del ${pretty(from)}`;

  return (
    <section className="group" aria-label={`Semana: ${title}`}>
      <div className="week-nav">
        <BarButton aria-label="Semana anterior" onClick={() => setFrom(addDays(from, -7))}>
          <ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" />
        </BarButton>
        <div style={{ textAlign: 'center' }}>
          <p className="t-headline">{title}</p>
          <p className="t-footnote c-secondary" style={{ margin: 0 }}>{pretty(from)} – {pretty(to)} · {daysLogged} de 7 días anotados</p>
        </div>
        <BarButton aria-label="Semana siguiente" disabled={from >= thisWeek} onClick={() => setFrom(addDays(from, 7))}>
          <ChevronRight size={22} strokeWidth={2.2} aria-hidden="true" />
        </BarButton>
      </div>
      <div className="group__body">
        {KEYS.map((k) => {
          const fmt = k === 'kcal' ? fmtKcal : fmtG;
          const unit = k === 'kcal' ? ' kcal' : ' g';
          return (
            <div key={k} className="row" style={{ display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                <span>{MACRO_LABEL[k]}</span>
                <span className="c-secondary">{daysLogged ? `${fmt(average[k])} de ${fmt(target[k])}${unit}` : '—'}</span>
              </div>
              <ProgressBar value={average[k]} max={target[k]} label={`${MACRO_LABEL[k]} promedio`} color={k} />
            </div>
          );
        })}
      </div>
      <p className="group__footer t-footnote" style={{ margin: 0 }}>Promedio por día, contando solo los días con algo anotado.</p>
    </section>
  );
}
