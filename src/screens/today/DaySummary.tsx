import { ProgressBar } from '../../ui/ProgressBar';
import { fmtG, fmtKcal, MACRO_LABEL } from '../../ui/labels';
import type { Macros } from '../../domain/types';

const MACROS = ['protein', 'carbs', 'fat'] as const;

// Arco: curva cuadrática suave. La escala va de 0 al doble de la meta, así la meta queda en el punto más alto.
const W = 320;
const P0 = { x: 10, y: 60 };
const P1 = { x: 160, y: 4 };
const P2 = { x: 310, y: 60 };
const ARC = `M${P0.x},${P0.y} Q${P1.x},${P1.y} ${P2.x},${P2.y}`;
const RANGE = 0.1; // ±10 % alrededor de la meta

function pointAt(t: number) {
  const u = 1 - t;
  return {
    x: u * u * P0.x + 2 * u * t * P1.x + t * t * P2.x,
    y: u * u * P0.y + 2 * u * t * P1.y + t * t * P2.y,
  };
}

function KcalArc({ eaten, target }: { eaten: number; target: number }) {
  const scale = target > 0 ? 2 * target : 1;
  const fill = Math.max(0, Math.min(100, (eaten / scale) * 100));
  const ticks = [(1 - RANGE) * target, (1 + RANGE) * target].map((v) => ({ v, p: pointAt(v / scale) }));
  return (
    <div role="meter" aria-label="Calorías del día" aria-valuemin={0} aria-valuemax={Math.round(target)} aria-valuenow={Math.round(eaten)} className="arc">
      <svg viewBox={`0 0 ${W} 84`} aria-hidden="true">
        <path d={ARC} pathLength={100} className="arc__track" />
        {fill > 0 && <path d={ARC} pathLength={100} className="arc__fill" strokeDasharray={`${fill} 100`} />}
        {ticks.map(({ v, p }, i) => (
          <g key={v}>
            <line x1={p.x} x2={p.x} y1={p.y - 7} y2={p.y + 7} className="arc__tick" />
            <text x={i === 0 ? p.x - 3 : p.x + 3} y={p.y + 22} textAnchor={i === 0 ? 'end' : 'start'} className="arc__label">{fmtKcal(v)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/** Resumen del día: calorías con arco y rango de meta, y debajo proteína, carbos y grasa. */
export function DaySummary({ eaten, target }: { eaten: Macros; target: Macros }) {
  const left = target.kcal - eaten.kcal;
  return (
    <section className="group day-wrap" aria-label="Resumen del día">
      <div className="group__body day">
        <div role="group" aria-label="Calorías" className="day__kcal">
          <p className="day__kcal-value">
            {fmtKcal(eaten.kcal)} <span className="day__slash">/</span> {fmtKcal(target.kcal)}
          </p>
          <p className="day__kcal-unit">kcal</p>
          <KcalArc eaten={eaten.kcal} target={target.kcal} />
          <p className="day__left t-subhead">
            {left >= 0 ? `Te quedan ${fmtKcal(left)} kcal` : `Te pasaste por ${fmtKcal(-left)} kcal`}
          </p>
        </div>
        <div className="day__macros">
          {MACROS.map((k) => (
            <div key={k} role="group" aria-label={MACRO_LABEL[k]} className="day__macro">
              <span className="day__macro-label">
                <span className="summary__dot" style={{ background: `var(--${k})` }} aria-hidden="true" />
                {MACRO_LABEL[k]}
              </span>
              <span className="day__macro-value">
                {fmtG(eaten[k])} / {fmtG(target[k])}{' '}g
              </span>
              <ProgressBar value={eaten[k]} max={target[k]} label={`${MACRO_LABEL[k]} consumido`} color={k} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
