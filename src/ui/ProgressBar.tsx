export type DataColor = 'kcal' | 'protein' | 'carbs' | 'fat';

export function ProgressBar({ value, max, label, color }: { value: number; max: number; label: string; color: DataColor }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(value)}
      data-over={value > max ? 'true' : undefined}
    >
      <div className="progress__fill" style={{ clipPath: `inset(0 ${100 - pct}% 0 0 round 2px)`, background: `var(--${color})` }} />
    </div>
  );
}
