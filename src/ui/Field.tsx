import { useId, useState, type InputHTMLAttributes } from 'react';
import { parseDecimal } from '../domain/numbers';

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  stacked?: boolean;
};

/** Fila con etiqueta a la izquierda y campo a la derecha, como en Ajustes. */
export function Field({ label, value, onChange, stacked, className, ...rest }: FieldProps) {
  const id = useId();
  return (
    <div className={['field', stacked ? 'field--stacked' : '', className ?? ''].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={stacked ? 'field__label t-footnote c-secondary' : 'field__label'}>{label}</label>
      <input {...rest} id={id} className="field__input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

type NumberFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'defaultValue'> & {
  label: string;
  unit?: string;
  /** Texto inicial; el componente maneja su propio texto para no perder lo que se escribe a medias. */
  initial?: string | number;
  onValueChange: (value: number | null, text: string) => void;
};

const toText = (v: string | number | undefined) =>
  v === undefined || v === '' ? '' : typeof v === 'number' ? String(v).replace('.', ',') : v;

/** Campo numérico con teclado decimal; acepta coma o punto. */
export function NumberField({ label, unit, initial, onValueChange, ...rest }: NumberFieldProps) {
  const id = useId();
  const [text, setText] = useState(() => toText(initial));
  const invalid = text.trim() !== '' && parseDecimal(text) === null;
  return (
    <div className="field">
      <label htmlFor={id} className="field__label">{label}</label>
      <input
        {...rest}
        id={id}
        className="field__input"
        inputMode="decimal"
        autoComplete="off"
        value={text}
        aria-invalid={invalid ? 'true' : undefined}
        onChange={(e) => {
          setText(e.target.value);
          onValueChange(parseDecimal(e.target.value), e.target.value);
        }}
      />
      {unit && <span className="field__unit" aria-hidden="true">{unit}</span>}
    </div>
  );
}
