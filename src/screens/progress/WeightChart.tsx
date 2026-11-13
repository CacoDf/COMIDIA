import { useState } from 'react';
import type { WeightEntry } from '../../domain/types';
import { EmptyState } from '../../ui/EmptyState';
import { fmtG1 } from '../../ui/labels';

const W = 343;
const H = 168;
const PAD = { top: 16, right: 12, bottom: 22, left: 36 };

const dayFmt = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' });
const label = (d: string) => {
  const [y, mo, da] = d.split('-').map(Number);
  return dayFmt.format(new Date(y, mo - 1, da, 12)).replace('.', '');
};
const toTime = (d: string) => {
  const [y, mo, da] = d.split('-').map(Number);
  return new Date(y, mo - 1, da, 12).getTime();
};

/** Peso en el tiempo: una sola serie, línea de 2 px, puntos de 8 px, tocar muestra el valor. */
export function WeightChart({ weights }: { weights: WeightEntry[] }) {
  const [active, setActive] = useState<number | null>(null);
  if (weights.length === 0) {
    return <EmptyState title="Sin registros todavía">Registra tu peso para ver cómo avanzas.</EmptyState>;
  }

  const ts = weights.map((w) => toTime(w.date));
  const kgs = weights.map((w) => w.kg);
  const t0 = Math.min(...ts);
  const t1 = Math.max(...ts);
  const lo = Math.floor(Math.min(...kgs) - 0.5);
  const hi = Math.ceil(Math.max(...kgs) + 0.5);
  const x = (t: number) => (t1 === t0 ? (PAD.left + W - PAD.right) / 2 : PAD.left + ((t - t0) / (t1 - t0)) * (W - PAD.left - PAD.right));
  const y = (kg: number) => PAD.top + ((hi - kg) / (hi - lo)) * (H - PAD.top - PAD.bottom);
  const pts = weights.map((w, i) => ({ x: x(ts[i]), y: y(w.kg), w }));
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const last = weights[weights.length - 1];
  const first = weights[0];
  const shown = active !== null ? pts[active] : pts[pts.length - 1];
  const summary = weights.length === 1
    ? `Gráfico de peso: ${fmtG1(last.kg)} kg el ${label(last.date)}`
    : `Gráfico de peso: de ${fmtG1(first.kg)} kg el ${label(first.date)} a ${fmtG1(last.kg)} kg el ${label(last.date)}`;

  function nearest(clientX: number, rect: DOMRect) {
    const px = ((clientX - rect.left) / rect.width) * W;
    let best = 0;
    pts.forEach((p, i) => { if (Math.abs(p.x - px) < Math.abs(pts[best].x - px)) best = i; });
    setActive(best);
  }

  return (
    <div className="chart">
      <p className="chart__readout">
        <span className="t-title2">{fmtG1(shown.w.kg)}</span> <span className="t-subhead c-secondary">kg · {label(shown.w.date)}</span>
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={summary}
        onPointerMove={(e) => nearest(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerDown={(e) => nearest(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={() => setActive(null)}
      >
        {[lo, (lo + hi) / 2, hi].map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} className="chart__grid" />
            <text x={PAD.left - 6} y={y(v) + 4} textAnchor="end" className="chart__tick">{fmtG1(v)}</text>
          </g>
        ))}
        <text x={PAD.left} y={H - 4} className="chart__tick">{label(first.date)}</text>
        {weights.length > 1 && <text x={W - PAD.right} y={H - 4} textAnchor="end" className="chart__tick">{label(last.date)}</text>}
        {active !== null && <line x1={shown.x} x2={shown.x} y1={PAD.top} y2={H - PAD.bottom} className="chart__cross" />}
        {weights.length > 1 && <path d={path} className="chart__line" />}
        {pts.map((p, i) => (
          <circle key={p.w.id} cx={p.x} cy={p.y} r={i === active || (active === null && i === pts.length - 1) ? 5 : 4} className="chart__dot" />
        ))}
      </svg>
    </div>
  );
}
