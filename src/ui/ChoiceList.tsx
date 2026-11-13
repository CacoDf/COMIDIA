import { useId, type ReactNode } from 'react';
import { Check } from 'lucide-react';

type Choice<T extends string> = { value: T; title: string; detail?: ReactNode };

/** Lista de opciones excluyentes con check a la derecha, como en Ajustes de iOS. */
export function ChoiceList<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T | undefined;
  options: Choice<T>[];
  onChange: (value: T) => void;
}) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <label key={o.value} className="row choice">
          <input
            className="visually-hidden"
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
          />
          <span className="row__text">
            <span style={{ display: 'block' }}>{o.title}</span>
            {o.detail && <span className="row__subtitle t-subhead" style={{ display: 'block' }}>{o.detail}</span>}
          </span>
          <Check className="choice__check" size={20} strokeWidth={2.5} aria-hidden="true" />
        </label>
      ))}
    </div>
  );
}
