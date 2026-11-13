import { useId } from 'react';

/** Fila con interruptor a la derecha, como en Ajustes de iOS. */
export function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="row">
      <label htmlFor={id} className="row__text" style={{ cursor: 'pointer' }}>{label}</label>
      <input
        id={id}
        className="switch"
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
}
