import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { BarButton } from './Button';

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Acción principal arriba a la derecha (ej. "Listo", "Agregar"). */
  doneLabel?: string;
  onDone?: () => void;
  doneDisabled?: boolean;
  children: ReactNode;
};

/** Hoja que sube desde abajo, con Cancelar a la izquierda y la acción principal a la derecha. */
export function Sheet({ open, title, onClose, doneLabel, onDone, doneDisabled, children }: Props) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Solo al abrir: si dependiera de onClose, cada redibujo le robaría el foco al campo que se está escribiendo.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panel} className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="sheet__grabber" aria-hidden="true" />
        <div className="sheet__header">
          <div><BarButton onClick={onClose}>Cancelar</BarButton></div>
          <h2 id={titleId} className="t-headline" style={{ textAlign: 'center' }}>{title}</h2>
          <div>{doneLabel && onDone && <BarButton bold onClick={onDone} disabled={doneDisabled}>{doneLabel}</BarButton>}</div>
        </div>
        <div className="sheet__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
