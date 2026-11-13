import { ProgressBar } from '../../ui/ProgressBar';
import { fmtG, fmtKcal, MACRO_LABEL } from '../../ui/labels';
import type { Macros } from '../../domain/types';

const KEYS = ['kcal', 'protein', 'carbs', 'fat'] as const;

/** Las cuatro cifras del día con el mismo peso: lo que queda (o lo que sobra), consumido de meta y barra. */
export function DaySummary({ eaten, target }: { eaten: Macros; target: Macros }) {
  return (
    <section className="group" aria-label="Resumen del día">
      <div className="group__body summary">
        {KEYS.map((k) => {
          const fmt = k === 'kcal' ? fmtKcal : fmtG;
          const unit = k === 'kcal' ? '' : ' g';
          const left = target[k] - eaten[k];
          const over = left < 0;
          return (
            <div key={k} role="group" aria-label={MACRO_LABEL[k]} className="summary__col">
              <span className="summary__label t-caption">
                <span className="summary__dot" style={{ background: `var(--${k})` }} aria-hidden="true" />
                {MACRO_LABEL[k]}
              </span>
              <span className="summary__value">
                {fmt(Math.abs(left))}
                {unit && <span className="summary__unit">{unit}</span>}
              </span>
              <span className="t-caption c-secondary">{over ? 'de más' : 'quedan'}</span>
              <ProgressBar value={eaten[k]} max={target[k]} label={`${MACRO_LABEL[k]} consumido`} color={k} />
              <span className="summary__of t-caption c-secondary">
                {fmt(eaten[k])} de {fmt(target[k])}{unit}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
