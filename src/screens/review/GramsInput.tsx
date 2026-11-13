import { useEffect, useState } from 'react';
import { parseDecimal } from '../../domain/numbers';

const toText = (g: number) => String(Math.round(g * 10) / 10).replace('.', ',');

/** Campo chico de gramos dentro de una fila. Mantiene lo que se escribe a medias y se sincroniza si los gramos cambian desde afuera. */
export function GramsInput({ grams, label, onChange }: { grams: number; label: string; onChange: (g: number) => void }) {
  const [text, setText] = useState(() => toText(grams));

  useEffect(() => {
    setText((cur) => (parseDecimal(cur) === Math.round(grams * 10) / 10 ? cur : toText(grams)));
  }, [grams]);

  const invalid = text.trim() !== '' && (parseDecimal(text) === null || parseDecimal(text) === 0);

  return (
    <span className="grams-input">
      <input
        aria-label={label}
        inputMode="decimal"
        autoComplete="off"
        value={text}
        aria-invalid={invalid ? 'true' : undefined}
        onChange={(e) => {
          setText(e.target.value);
          const v = parseDecimal(e.target.value);
          if (v !== null && v > 0) onChange(v);
        }}
        onBlur={() => { if (invalid || text.trim() === '') setText(toText(grams)); }}
      />
      <span aria-hidden="true">g</span>
    </span>
  );
}
